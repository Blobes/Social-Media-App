import { Request, Response, NextFunction } from "express";
import { IMediaInput, ModerationResponse } from "../utils/types/types";
import { Severity } from "../services/moderation/policy";
import { validateText } from "../services/moderation/validateText";
import { validateMedia } from "../services/moderation/validateMedia";

interface ContentRequest extends Request {
  body: {
    caption?: string;
    media?: IMediaInput[];
    topics?: string[];
    needsReview?: boolean;
    skipModeration?: boolean;
    severity?: Severity | null;
    ruleViolated?: string | null;
    reason?: string | null;
  };
  moderation?: {
    topics: string[];
    needsReview: boolean;
    ruleViolated?: string | null;
    severity?: Severity | null;
    reason?: string | null;
  };
}

export const moderateContent = async (
  req: ContentRequest,
  res: Response,
  next: NextFunction,
) => {
  const {
    caption,
    media,
    topics,
    skipModeration = false,
    needsReview = false,
    severity,
    ruleViolated,
    reason,
  } = req.body;

  const hasText = !!(caption && caption.trim().length > 0);
  const hasUserTopics = !!(topics && topics.length > 0);
  const hasMedia = !!(media && media.length > 0);

  const mediaToValidate = hasMedia ? media.slice(0, 2) : [];

  // 1. Check for User Bypass (Only applies to non-CRITICAL items previously warned)
  if (skipModeration) {
    req.moderation = {
      topics: topics || [], // For manage topic api
      needsReview,
      severity, // For flagged post api
      ruleViolated,
      reason:
        reason || "User proceeded after acknowledgment of possible violations",
    };
    return next();
  }

  try {
    const [textResult, ...mediaResults]: ModerationResponse[] =
      await Promise.all([
        hasText
          ? validateText(caption, topics || [])
          : Promise.resolve({
              isUnsure: false,
              ruleViolated: null,
              severity: null,
              reason: null,
              extractedTopics: [],
            }),

        ...mediaToValidate.map((item, index) =>
          validateMedia(item.url, !hasText && !hasUserTopics && index === 0),
        ),
      ]);

    const allResults = [textResult, ...mediaResults];
    const violation = allResults.find((r) => r.isFlagged);

    if (violation) {
      if (violation.isUnsure) {
        res.status(202).json({
          status: "WARNING",
          severity: violation.severity,
          type: violation.ruleViolated,
          reason: `We noticed potential ${violation.ruleViolated?.toLowerCase()}. Please review your content.`,
          topics:
            violation.extractedTopics.length > 0
              ? violation.extractedTopics
              : topics || [],
          needsReview: violation.severity !== Severity.LOW ? true : false, // Indicates if the post should be flagged or not
        });
        return;
      }

      // 2. ENFORCEMENT LOGIC BASED ON CERTAIN SEVERITY
      switch (violation.severity) {
        case Severity.CRITICAL:
          res.status(403).json({
            status: "REJECTED",
            severity: Severity.CRITICAL,
            type: violation.ruleViolated,
            reason:
              "This content violates our core safety policies and cannot be posted.",
          });
          return;

        case Severity.MODERATE:
          res.status(422).json({
            status: "BLOCKED",
            severity: Severity.MODERATE,
            type: violation.ruleViolated,
            reason:
              violation.reason ||
              "Content requires editing before it can be posted.",
          });
          return;

        case Severity.LOW:
          res.status(202).json({
            status: "WARNING",
            severity: Severity.LOW,
            type: violation.ruleViolated,
            reason: violation.reason,
            topics:
              violation.extractedTopics.length > 0
                ? violation.extractedTopics
                : topics || [],
            needsReview: false, // Indicates that the post should not be flagged
          });
          return;
      }
    }

    // 3. Topic Assignment Logic (If no violations found)
    let finalTopics: string[] = [];
    if (hasUserTopics) {
      finalTopics = topics as string[];
    } else if (hasText && textResult.extractedTopics.length > 0) {
      finalTopics = textResult.extractedTopics.slice(0, 2);
    } else if (mediaResults.length > 0 && mediaResults[0].extractedTopics) {
      finalTopics = mediaResults[0].extractedTopics.slice(0, 2);
    }

    req.moderation = {
      topics: finalTopics,
      needsReview: false,
      severity: null,
      ruleViolated: null,
      reason: null,
    };

    next();
  } catch (error) {
    console.error("Moderation Guard Error:", error);
    res.status(500).json({ error: "Internal Moderation Error" });
  }
};

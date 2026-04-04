import { Request, Response, NextFunction } from "express";
import {
  IMediaInput,
  IModerationReq,
  IModerationRes,
  ISeverity,
} from "../types/types";
import { validateText } from "../services/moderation/validateText";
import { validateMedia } from "../services/moderation/validateMedia";

interface ContentRequest extends Request {
  body: {
    caption?: string;
    media?: IMediaInput[];
    topics?: string[];
    needsReview?: boolean;
    skipModeration?: boolean;
    severity?: ISeverity | null;
    ruleViolated?: string | null;
    reason?: string | null;
  };
  moderation?: IModerationReq;
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
    const [textResult, ...mediaResults]: IModerationRes[] = await Promise.all([
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
          needsReview: violation.severity !== ISeverity.LOW ? true : false, // Indicates if the post should be flagged or not
        });
        return;
      }

      // 2. ENFORCEMENT LOGIC BASED ON CERTAIN SEVERITY
      switch (violation.severity) {
        case ISeverity.CRITICAL:
          res.status(403).json({
            status: "REJECTED",
            severity: ISeverity.CRITICAL,
            type: violation.ruleViolated,
            reason:
              "This content violates our core safety policies and cannot be posted.",
          });
          return;

        case ISeverity.MODERATE:
          res.status(422).json({
            status: "BLOCKED",
            severity: ISeverity.MODERATE,
            type: violation.ruleViolated,
            reason:
              violation.reason ||
              "Content requires editing before it can be posted.",
          });
          return;

        case ISeverity.LOW:
          res.status(202).json({
            status: "WARNING",
            severity: ISeverity.LOW,
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

    console.log("FINAL MODERATION OBJECT:", req.moderation);
    next();
  } catch (error: any) {
    console.error("Moderation Guard Error:", error);

    // If OpenAI fails (quota/network), allow the request to continue
    // but flag it for manual review or set default topics.
    if (error.status === 429 || error.code === "insufficient_quota") {
      req.moderation = {
        topics: topics || [],
        needsReview: true,
        severity: null,
        ruleViolated: "AI_QUOTA_EXCEEDED",
        reason: "Moderation skipped due to API limits.",
      };
      return next();
    }

    // Fallback for other unexpected errors
    return res.status(500).json({
      status: "ERROR",
      message: "Internal Moderation Error",
    });
  }
};

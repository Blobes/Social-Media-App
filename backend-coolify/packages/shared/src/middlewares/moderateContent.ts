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

/**
 * Higher-order middleware factory for content moderation.
 */
export const ContentModerator = (openaiKey: string) => {
  return async (
    req: ContentRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
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

    // Check for User Bypass (Only applies to non-CRITICAL items previously warned)
    if (skipModeration) {
      req.moderation = {
        topics: topics || [],
        needsReview,
        severity,
        ruleViolated,
        reason:
          reason ||
          "User proceeded after acknowledgment of possible violations",
      };
      return next();
    }

    try {
      const [textResult, ...mediaResults]: IModerationRes[] = await Promise.all(
        [
          hasText
            ? validateText(openaiKey, caption!, topics || [])
            : Promise.resolve({
                isUnsure: false,
                ruleViolated: null,
                severity: null,
                reason: null,
                extractedTopics: [],
                isFlagged: false,
              }),

          ...mediaToValidate.map((item, index) =>
            validateMedia(
              openaiKey,
              item.url,
              !hasText && !hasUserTopics && index === 0,
            ),
          ),
        ],
      );

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
            needsReview: violation.severity !== ISeverity.LOW ? true : false,
          });
          return;
        }

        // ENFORCEMENT LOGIC BASED ON CERTAIN SEVERITY
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
              needsReview: false,
            });
            return;
        }
      }

      // Topic Assignment Logic (If no violations found)
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

      return next();
    } catch (error: any) {
      console.error("Moderation Guard Error:", error);

      // If OpenAI fails (quota/network), allow request to continue flagged for review
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

      res.status(500).json({
        status: "ERROR",
        message: "Internal Moderation Error",
      });
      return;
    }
  };
};

import { IModerationRes, ISeverity } from "../../types/types";
import { validateText } from "./validateText";
import { validateMedia } from "./validateMedia";
import { IMedia } from "@repo/database";

export const validatePost = async (
  openaiKey: string,
  data: {
    caption?: string;
    media?: IMedia[];
    topics?: string[];
    skipModeration?: boolean;
  },
) => {
  const { caption, media, topics, skipModeration = false } = data;

  // 1. Handle User Bypass (Original skipModeration logic)
  if (skipModeration) {
    return {
      status: "PUBLISHED",
      topics: topics || [],
      needsReview: false,
      severity: null,
      ruleViolated: null,
      reason: "User proceeded after acknowledgment",
    };
  }

  try {
    const hasText = !!(caption && caption.trim().length > 0);
    const hasUserTopics = !!(topics && topics.length > 0);
    const mediaToValidate = (media || []).slice(0, 2);

    const [textResult, ...mediaResults]: IModerationRes[] = await Promise.all([
      hasText
        ? validateText(openaiKey, caption!, topics || [])
        : Promise.resolve({
            isFlagged: false,
            isUnsure: false,
            ruleViolated: null,
            severity: null,
            reason: null,
            extractedTopics: [],
          }),
      ...mediaToValidate.map((item, index) =>
        validateMedia(
          openaiKey,
          item.url,
          !hasText && !hasUserTopics && index === 0,
        ),
      ),
    ]);

    const allResults = [textResult, ...mediaResults];
    const violation = allResults.find((r) => r.isFlagged);

    // 2. Map original HTTP responses to DB Statuses
    if (violation) {
      if (violation.isUnsure) {
        return {
          status: "UNDER_REVIEW", // Original: 202 WARNING
          severity: violation.severity,
          ruleViolated: violation.ruleViolated,
          topics:
            violation.extractedTopics.length > 0
              ? violation.extractedTopics
              : topics || [],
          needsReview: violation.severity !== ISeverity.LOW,
        };
      }

      switch (violation.severity) {
        case ISeverity.CRITICAL:
          return {
            status: "BANNED",
            severity: ISeverity.CRITICAL,
            ruleViolated: violation.ruleViolated,
          }; // Original: 403 REJECTED
        case ISeverity.MODERATE:
          return {
            status: "UNDER_REVIEW",
            severity: ISeverity.MODERATE,
            ruleViolated: violation.ruleViolated,
          }; // Original: 422 BLOCKED
        case ISeverity.LOW:
          return {
            status: "SHADOWBANNED",
            severity: ISeverity.LOW,
            ruleViolated: violation.ruleViolated,
          }; // Original: 202 WARNING
      }
    }

    // 3. Original Topic Assignment Logic
    let finalTopics: string[] = [];
    if (hasUserTopics) finalTopics = topics!;
    else if (hasText && textResult.extractedTopics.length > 0)
      finalTopics = textResult.extractedTopics.slice(0, 2);
    else if (mediaResults.length > 0 && mediaResults[0].extractedTopics)
      finalTopics = mediaResults[0].extractedTopics.slice(0, 2);

    return {
      status: "PUBLISHED",
      topics: finalTopics,
      needsReview: false,
      severity: null,
      ruleViolated: null,
    };
  } catch (error: any) {
    // Fallback for AI Quota errors (Original error logic)
    return {
      status: "UNDER_REVIEW",
      topics: topics || [],
      needsReview: true,
      ruleViolated: "AI_ERROR",
      reason: error.message,
    };
  }
};

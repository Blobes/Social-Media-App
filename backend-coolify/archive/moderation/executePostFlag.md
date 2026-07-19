import {
  FlaggedPostModel,
  GistModel,
  PostReportModel,
  UserModel,
} from "@repo/database";
import { FlagPostData, TransInfo } from "../../types";
import { calculateThreshold } from "../../utils/misc/calculations";
import { MESSAGES_REGISTRY } from "../../constants/msgRegistry";

const MAX_MODERATION_ATTEMPTS = 3;

export interface ExecutePostFlagResult {
  escalated: boolean;
  transInfo: TransInfo;
  logId: string;
  status: "SUCCESS" | "CONFLICT" | "NOT_FOUND";
}

/**
 * Executes the core content moderation reporting, evaluation, and escalation pipeline.
 */
export const executePostFlag = async (
  payload: FlagPostData,
  reporterId: string | null,
): Promise<ExecutePostFlagResult> => {
  const {
    postId,
    postType,
    authorId,
    source,
    severity,
    ruleViolated,
    reason,
    contentSnapshot,
  } = payload;

  // Manage/Create Case File
  const flaggedRecord = await FlaggedPostModel.findOneAndUpdate(
    { postId, postType },
    {
      $setOnInsert: { authorId, contentSnapshot, reviewStatus: "PENDING" },
      $addToSet: { violationSummary: ruleViolated },
    },
    { upsert: true, new: true, runValidators: true },
  );

  // Record Unique Report (Atomic)
  try {
    await PostReportModel.create({
      flaggedPostId: flaggedRecord._id,
      reporterId,
      source,
      severity,
      reason,
      ruleViolated,
    });
  } catch (e: any) {
    if (e.code === 11000) {
      return {
        escalated: false,
        transInfo: MESSAGES_REGISTRY.POST.POST_ALREADY_REPORTED,
        logId: String(flaggedRecord._id),
        status: "CONFLICT",
      };
    }
    throw e;
  }

  // Fetch Post Metadata
  const PostModel = postType === "GIST" ? GistModel : GistModel;
  const postData = await PostModel.findById(postId).select(
    "viewCount status moderationCount",
  );

  if (!postData) {
    return {
      escalated: false,
      transInfo: MESSAGES_REGISTRY.POST.POST_SOURCE_NOT_FOUND,
      logId: String(flaggedRecord._id),
      status: "NOT_FOUND",
    };
  }

  // Threshold & Priority Logic
  const reportCount = await PostReportModel.countDocuments({
    flaggedPostId: flaggedRecord._id,
    source: "USER",
  });
  const criticalCount = await PostReportModel.countDocuments({
    flaggedPostId: flaggedRecord._id,
    severity: severity,
  });
  const currentThreshold = calculateThreshold(postData.viewCount || 0);

  const isCriticalMass =
    reportCount > 0 &&
    (criticalCount / reportCount) * 100 >= 50 &&
    criticalCount >= currentThreshold;
  const shouldEscalate =
    source === "AI" || reportCount >= currentThreshold || isCriticalMass;

  if (shouldEscalate) {
    const updatePromises: any[] = [];

    if (isCriticalMass) {
      updatePromises.push(
        FlaggedPostModel.findByIdAndUpdate(flaggedRecord._id, {
          priority: "HIGH",
        }),
      );
    }

    // AUTO-REJECTION (Post Fatigue)
    if (
      postData.status !== "BANNED" &&
      (postData.moderationCount || 0) >= MAX_MODERATION_ATTEMPTS
    ) {
      const updatedUser = await UserModel.findByIdAndUpdate(
        authorId,
        { $inc: { moderationStrikes: 1 } },
        { new: true },
      );

      updatePromises.push(
        PostModel.findByIdAndUpdate(postId, { status: "BANNED" }),
        FlaggedPostModel.findByIdAndUpdate(flaggedRecord._id, {
          reviewStatus: "REJECTED",
          resolutionNote:
            MESSAGES_REGISTRY.POST.POST_AUTOMATED_REJECTION_NOTE.message,
        }),
        PostReportModel.deleteMany({ flaggedPostId: flaggedRecord._id }),
      );

      if (updatedUser && updatedUser.moderationStrikes >= 3) {
        const expires = new Date();
        expires.setDate(expires.getDate() + 7);
        updatePromises.push(
          UserModel.findByIdAndUpdate(authorId, {
            $set: {
              accountStatus: "SUSPENDED",
              suspensionExpiresAt: expires,
              suspensionReason:
                MESSAGES_REGISTRY.POST.POST_AUTOMATED_SUSPENSION_REASON(
                  updatedUser.moderationStrikes,
                ).message,
            },
          }),
        );
      }

      await Promise.all(updatePromises);
      return {
        escalated: true,
        transInfo: MESSAGES_REGISTRY.POST.POST_BANNED_AND_PENALIZED,
        logId: String(flaggedRecord._id),
        status: "SUCCESS",
      };
    }

    // STANDARD ESCALATION (Under Review / Shadowbanned on AI operational fault)
    const targetStatus =
      ruleViolated === "AI_ERROR" ? "SHADOWBANNED" : "UNDER_REVIEW";

    if (postData.status !== targetStatus) {
      const postUpdate: any = {
        status: targetStatus,
        moderationLogId: flaggedRecord._id,
      };
      updatePromises.push(PostModel.findByIdAndUpdate(postId, postUpdate));
    }

    await Promise.all(updatePromises);
  }

  return {
    escalated: shouldEscalate,
    transInfo: shouldEscalate
      ? MESSAGES_REGISTRY.POST.POST_PLACED_UNDER_REVIEW
      : MESSAGES_REGISTRY.POST.POST_REPORT_RECEIVED,
    logId: String(flaggedRecord._id),
    status: "SUCCESS",
  };
};

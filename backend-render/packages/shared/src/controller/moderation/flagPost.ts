import {
  FlaggedPostModel,
  GistModel,
  PostReportModel,
  UserModel,
} from "@repo/database";
import { Response } from "express";
import { calculateThreshold } from "../../utils/misc/calculations";
import { IAuthRequest, ISeverity } from "../../types/types";

interface flagRequest extends IAuthRequest {
  body: {
    postId: string;
    postType: "GIST" | "STAKE";
    authorId: string;
    source: "AI" | "USER";
    severity: ISeverity;
    ruleViolated: string;
    reason: string;
    confidence?: number;
    contentSnapshot: {
      text?: string;
      media?: string[];
    };
  };
}

const MAX_MODERATION_ATTEMPTS = 3;

// Rules that trigger the visual blur (hasSensitiveGraphic)
const SENSITIVE_RULES = ["adult", "violence", "Severe Violence", "NSFW Media"];

export const flagPost = async (
  req: flagRequest,
  res: Response,
): Promise<void> => {
  try {
    const {
      postId,
      postType,
      authorId,
      source,
      severity,
      ruleViolated,
      reason,
      confidence,
      contentSnapshot,
    } = req.body;

    const reporterId = source === "USER" ? req.user?.id : null;

    // 1. Manage/Create Case File
    // We update the priority here if isCriticalMass is already known,
    // but usually, we calculate it first then update.
    const flaggedRecord = await FlaggedPostModel.findOneAndUpdate(
      { postId, postType },
      {
        $setOnInsert: { authorId, contentSnapshot, reviewStatus: "PENDING" },
        $addToSet: { violationSummary: ruleViolated },
      },
      { upsert: true, new: true, runValidators: true },
    );

    // 2. Record Unique Report (Atomic)
    try {
      await PostReportModel.create({
        flaggedPostId: flaggedRecord._id,
        reporterId,
        source,
        severity,
        reason,
        ruleViolated,
        confidence: confidence || null,
      });
    } catch (e: any) {
      if (e.code === 11000) {
        res.status(400).json({
          status: "ERROR",
          message: "You have already reported this post.",
        });
        return;
      }
      throw e;
    }

    // 3. Fetch Post Metadata
    const PostModel = postType === "GIST" ? GistModel : GistModel;
    const postData = await PostModel.findById(postId).select(
      "viewCount status moderationCount",
    );

    if (!postData) {
      res
        .status(404)
        .json({ status: "ERROR", message: "Source post not found." });
      return;
    }

    // 4. Threshold & Priority Logic
    const reportCount = await PostReportModel.countDocuments({
      flaggedPostId: flaggedRecord._id,
      source: "USER",
    });
    const criticalCount = await PostReportModel.countDocuments({
      flaggedPostId: flaggedRecord._id,
      severity: ISeverity.CRITICAL,
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
      const isSensitiveViolation = SENSITIVE_RULES.includes(ruleViolated);

      // --- NEW: Set FlaggedPost Priority to HIGH if Critical Mass is reached ---
      if (isCriticalMass) {
        updatePromises.push(
          FlaggedPostModel.findByIdAndUpdate(flaggedRecord._id, {
            priority: "HIGH",
          }),
        );
      }

      // 5. AUTO-REJECTION (Post Fatigue)
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
              "Automated rejection: Content exceeded maximum moderation cycles.",
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
                suspensionReason: `Automated: ${updatedUser.moderationStrikes} strikes reached.`,
              },
            }),
          );
        }

        await Promise.all(updatePromises);
        res.status(200).json({
          status: "SUCCESS",
          message: "Post banned and user penalized.",
          escalated: true,
        });
        return;
      }

      // 6. STANDARD ESCALATION (Under Review)
      if (postData.status !== "UNDER_REVIEW") {
        const postUpdate: any = {
          status: "UNDER_REVIEW",
          moderationLogId: flaggedRecord._id,
        };
        updatePromises.push(PostModel.findByIdAndUpdate(postId, postUpdate));
      }

      await Promise.all(updatePromises);
    }

    res.status(201).json({
      status: "SUCCESS",
      message: shouldEscalate
        ? "Post placed under review."
        : "Report received.",
      source,
      logId: flaggedRecord._id,
      escalated: shouldEscalate,
    });
  } catch (error: any) {
    console.error("Flagging Sync Error:", error);
    res.status(500).json({
      status: "ERROR",
      error: "Internal flagging synchronization error.",
    });
  }
};

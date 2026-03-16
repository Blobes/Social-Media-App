import { Response } from "express";
import { FlaggedPostModel } from "@/models/moderation/flaggedPost";
import { GistModel } from "@/models/post/gist";
import { AuthRequest } from "@/middlewares/verifyAuthToken";
import { UserModel } from "@/models/user/user";
import { PostReportModel } from "@/models/moderation/postReport";

interface ResolveRequest extends AuthRequest {
  body: {
    flagId: string;
    resolution: "APPROVED" | "REJECTED";
    reasonNote?: string;
  };
}

export const resolveFlaggedPost = async (
  req: ResolveRequest,
  res: Response,
): Promise<any> => {
  const { flagId, resolution, reasonNote } = req.body;

  try {
    const log = await FlaggedPostModel.findByIdAndUpdate(
      flagId,
      {
        reviewStatus: resolution,
        reviewedBy: req.user?.id,
        resolutionNote: reasonNote,
      },
      { new: true },
    );

    if (!log)
      return res.status(404).json({ error: "Moderation record not found." });

    const PostModel = log.postType === "GIST" ? GistModel : GistModel;
    const newStatus = resolution === "APPROVED" ? "PUBLISHED" : "BANNED";

    if (PostModel) {
      const updatePayload: any = {
        $set: { status: newStatus, updatedAt: new Date() },
      };

      if (resolution === "APPROVED") {
        updatePayload.$unset = { moderationLogId: "" };
        // Increment the count of times this post has been moderated/saved
        updatePayload.$inc = { moderationCount: 1 };
      }
      await PostModel.findByIdAndUpdate(log.postId, updatePayload);
    }

    // Penalty logic for REJECTED content
    if (resolution === "REJECTED") {
      const updatedUser = await UserModel.findByIdAndUpdate(
        log.authorId,
        { $inc: { moderationStrikes: 1 } },
        { new: true },
      );

      if (updatedUser && updatedUser.moderationStrikes >= 3) {
        const suspendedUntil = new Date();
        suspendedUntil.setDate(suspendedUntil.getDate() + 7);

        await UserModel.findByIdAndUpdate(log.authorId, {
          $set: {
            accountStatus: "SUSPENDED",
            suspensionExpiresAt: suspendedUntil,
            suspensionReason: `Automated: ${updatedUser.moderationStrikes} strikes reached.`,
          },
        });
      }
    }

    // ALWAYS cleanup individual reports once a decision (manual or auto) is made
    await PostReportModel.deleteMany({ flaggedPostId: flagId });

    return res.status(200).json({
      status: "SUCCESS",
      message: `Content ${resolution.toLowerCase()}. Reports purged.`,
      data: { postId: log.postId, newStatus },
    });
  } catch (error) {
    console.error("Resolution Error:", error);
    return res
      .status(500)
      .json({ status: "ERROR", error: "Resolution failed." });
  }
};

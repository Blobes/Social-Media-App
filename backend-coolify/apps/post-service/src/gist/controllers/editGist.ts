import mongoose from "mongoose";
import { Response } from "express";
import { IAuthRequest, enqueueModerationTask } from "@repo/shared";
import { GistModel } from "@repo/database";
import { FUNSTAKES_REDIS_URL } from "@/envVars";

interface EditRequest extends IAuthRequest {
  body: {
    content: string;
    gistId: string;
  };
}

/**
 * Validates post ownership, limits edit frequencies, and enqueues the modified text to the Go moderation pipeline.
 */
export const editGist = async (
  req: EditRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.id;
  const { content, gistId } = req.body;

  if (!content?.trim()) {
    res.status(400).json({
      message: "Content cannot be empty during an edit.",
      status: "ERROR",
      payload: null,
    });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(gistId) || !userId) {
    res.status(400).json({
      status: "ERROR",
      payload: null,
      message: "Invalid Gist ID or Session",
    });
    return;
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const gist = await GistModel.findById(gistId).session(session);

    if (!gist) {
      res
        .status(404)
        .json({ message: "Gist not found", status: "ERROR", payload: null });
      return;
    }

    if (gist.authorId.toString() !== userId) {
      res
        .status(403)
        .json({ message: "Permission denied", status: "ERROR", payload: null });
      return;
    }

    // Verify user has not already used up their maximum edit modification allowances
    if (gist.editCount >= 3) {
      res.status(400).json({
        status: "ERROR",
        payload: null,
        message: "Maximum edit limit (3) reached for this post.",
      });
      return;
    }

    // Lock visibility during execution. Notice editCount does NOT increment here anymore
    gist.status = "UNDER_REVIEW";
    await gist.save({ session });

    await enqueueModerationTask(FUNSTAKES_REDIS_URL, "moderate:post", {
      postId: gist._id.toString(),
      type: "GIST",
      userId: userId.toString(),
      caption: content.trim(),
      media: [],
      topics: gist.topics || [],
      skipModeration: false,
      event: "POST_UPDATE",
    });

    await session.commitTransaction();

    res.status(202).json({
      status: "SUCCESS",
      payload: { gistId: gist._id },
      message: "Gist update is undergoing moderation review.",
    });
  } catch (error: any) {
    await session.abortTransaction();
    console.error("Critical Edit Error:", error);
    res.status(500).json({
      status: "ERROR",
      payload: null,
      message: error.message || "Failed to initiate update moderation stream",
    });
  } finally {
    session.endSession();
  }
};

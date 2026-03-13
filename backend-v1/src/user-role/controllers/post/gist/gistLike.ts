import mongoose from "mongoose";
import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyAuthToken";
import { GistLikeModel, GistModel } from "@/models/post/gist";

export const gistLike = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  const gistId = req.params.id;
  const userId = req.user?.id;

  // 1. Initial Validation
  if (!userId) {
    return res.status(401).json({
      payload: null,
      status: "ERROR",
      message: "Unauthorized",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(gistId)) {
    return res.status(400).json({
      payload: null,
      status: "ERROR",
      message: "Invalid gist ID",
    });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // 2. Fetch the container (Gist)
    const gist = await GistModel.findById(gistId).session(session);
    if (!gist) {
      await session.abortTransaction();
      return res.status(404).json({
        payload: null,
        status: "ERROR",
        message: "Gist not found",
      });
    }

    // 3. Check for existing like using correct field 'gistId'
    const existingLike = await GistLikeModel.findOne({
      gistId,
      userId,
    }).session(session);

    let isLiked: boolean;

    if (existingLike) {
      // UNLIKE LOGIC
      await GistLikeModel.deleteOne({ _id: existingLike._id }).session(session);

      // Atomic decrement
      await GistModel.updateOne(
        { _id: gistId },
        { $inc: { likeCount: -1 } },
        { session },
      );
      isLiked = false;
    } else {
      // LIKE LOGIC
      await GistLikeModel.create(
        [
          {
            gistId,
            userId,
          },
        ],
        { session },
      );

      // Atomic increment
      await GistModel.updateOne(
        { _id: gistId },
        { $inc: { likeCount: 1 } },
        { session },
      );
      isLiked = true;
    }

    await session.commitTransaction();

    // 4. Fetch the final count post-transaction for accuracy
    const updatedGist = await GistModel.findById(gistId)
      .select("likeCount")
      .lean();

    return res.status(200).json({
      status: "SUCCESS",
      message: isLiked
        ? "Gist liked successfully"
        : "Gist unliked successfully",
      payload: {
        likedByMe: isLiked,
        likeCount: updatedGist?.likeCount ?? 0,
      },
    });
  } catch (error: any) {
    if (session.inTransaction()) {
      // Check if transaction is active
      await session.abortTransaction();
    }

    console.error("Like Gist Error:", error);
    return res.status(500).json({
      payload: null,
      status: "ERROR",
      message: error.message || "Server error while toggling like",
    });
  } finally {
    session.endSession();
  }
};

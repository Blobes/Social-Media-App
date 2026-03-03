import mongoose from "mongoose";
import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyAuthToken";
import { GistLikeModel, GistModel } from "@/models/post/gist";

export const likeGist = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  const postId = req.params.id;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      status: "ERROR",
      message: "Unauthorized",
      payload: null,
    });
  }

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({
      status: "ERROR",
      message: "Invalid post ID",
      payload: null,
    });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const post = await GistModel.findById(postId).session(session);
    if (!post) {
      await session.abortTransaction();
      return res.status(404).json({
        status: "ERROR",
        message: "Post not found",
        payload: null,
      });
    }

    const existingLike = await GistLikeModel.findOne({
      postId,
      userId,
    }).session(session);

    let liked: boolean;

    if (existingLike) {
      // UNLIKE
      await GistLikeModel.deleteOne({ _id: existingLike._id }).session(session);

      await GistModel.updateOne(
        { _id: postId },
        { $inc: { likeCount: -1 } },
        { session },
      );
      liked = false;
    } else {
      // LIKE
      await GistLikeModel.create(
        [
          {
            postId,
            userId,
          },
        ],
        { session },
      );

      await GistModel.updateOne(
        { _id: postId },
        { $inc: { likeCount: 1 } },
        { session },
      );
      liked = true;
    }

    await session.commitTransaction();

    const updatedPost = await GistModel.findById(postId).select("likeCount");

    return res.status(200).json({
      status: "SUCCESS",
      message: liked ? "Post liked" : "Post unliked",
      payload: {
        likedByMe: liked,
        likeCount: updatedPost?.likeCount ?? 0,
      },
    });
  } catch (error: any) {
    await session.abortTransaction();

    return res.status(500).json({
      status: "ERROR",
      message: error.message || "Server error",
      payload: null,
    });
  } finally {
    session.endSession();
  }
};

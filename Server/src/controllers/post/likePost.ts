import mongoose from "mongoose";
import { PostModel, UserModel } from "@/models";
import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyToken";

export const likePost = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  const postId = req.params.id;
  const currUserId = req.user?.id; // ✅ Comes from JWT, not the body

  if (!currUserId) {
    return res.status(401).json({
      message: "Unauthorized: No user ID found in token",
      status: "ERROR",
      payload: null,
    });
  }

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({
      message: "Post ID format is not valid",
      status: "ERROR",
      payload: null,
    });
  }

  try {
    const currentUser = await UserModel.findById(currUserId);
    if (!currentUser) {
      return res.status(404).json({
        message: "User not found",
        status: "ERROR",
        payload: null,
      });
    }

    const post = await PostModel.findById(postId);
    if (!post) {
      return res.status(404).json({
        message: "Post not found",
        status: "ERROR",
        payload: null,
      });
    }

    const isLiked = post.likes.includes(currUserId);
    const update = isLiked
      ? { $pull: { likes: currUserId } }
      : { $push: { likes: currUserId } };

    const updatedPost = await PostModel.findByIdAndUpdate(postId, update, {
      new: true,
    });

    res.status(200).json({
      message: isLiked ? "Unliked post." : "Liked successfully.",
      status: "SUCCESS",
      payload: updatedPost,
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Failed due to server error",
      payload: null,
      status: "ERROR",
    });
  }
};

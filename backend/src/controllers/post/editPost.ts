import mongoose from "mongoose";
import { PostModel } from "@/models";
import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyAuthToken"; // type with user?: JwtUserPayload

interface EditRequest extends AuthRequest {
  body: {
    content: string;
  };
}

export const editPost = async (
  req: EditRequest,
  res: Response
): Promise<void> => {
  const postId = req.params.id;
  const userId = req.user?.id; // from JWT payload
  const { content } = req.body;

  if (!content?.trim()) {
    res.status(400).json({
      message: "Content is required",
      status: "ERROR",
      payload: null,
    });
    return;
  }

  if (
    !mongoose.Types.ObjectId.isValid(postId) ||
    !userId ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    res.status(400).json({
      message: "Post ID or User ID format not valid",
      status: "ERROR",
      payload: null,
    });
    return;
  }

  try {
    const post = await PostModel.findById(postId);
    if (!post) {
      res.status(404).json({
        message: "Post not found",
        status: "ERROR",
        payload: null,
      });
      return;
    }

    if (userId !== post.authorId.toString()) {
      res.status(403).json({
        message: "You are not the author of this post, so you cannot edit it.",
        status: "ERROR",
        payload: null,
      });
      return;
    }

    post.content = content.trim();
    await post.save();

    res.status(200).json({
      message: "Post edited successfully",
      payload: post,
      status: "SUCCESS",
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Failed to edit post due to server error",
      payload: null,
      status: "ERROR",
    });
  }
};

export default editPost;

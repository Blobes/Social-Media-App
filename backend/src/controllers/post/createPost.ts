import mongoose from "mongoose";
import { PostModel, UserModel } from "@/models";
import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyAuthToken";

interface CreateRequest extends AuthRequest {
  body: {
    content: string;
    postImage?: string; // optional if not always provided
  };
}

export const createPost = async (
  req: CreateRequest,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  const { content, postImage } = req.body;

  // Validate content
  if (!content?.trim()) {
    res.status(400).json({
      message: "Content is required",
      status: "ERROR",
      payload: null,
    });
    return;
  }

  // Validate MongoDB ID format
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({
      message: "User ID format not valid",
      status: "ERROR",
      payload: null,
    });
    return;
  }

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({
        message: "User not found",
        status: "ERROR",
        payload: null,
      });
      return;
    }

    const newPost = await PostModel.create({
      authorId: userId,
      content: content.trim(),
      postImage,
    });

    res.status(201).json({
      message: "Post created successfully",
      payload: newPost,
      status: "SUCCESS",
    });
  } catch (error: any) {
    console.error("Error creating post:", error);
    res.status(500).json({
      message: error.message || "Failed to create post due to server error",
      payload: null,
      status: "ERROR",
    });
  }
};

export default createPost;

import mongoose from "mongoose";
import { PostModel } from "@/models";
import { Request, Response } from "express";

export const getUserPosts = async (
  req: Request,
  res: Response
): Promise<any> => {
  const userId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      message: "User ID format is not valid",
      status: "ERROR",
      payload: null,
    });
  }

  try {
    const userPosts = await PostModel.find({ authorId: userId })
      .sort({ createdAt: -1 })
      .lean();

    if (userPosts.length === 0) {
      return res.status(404).json({
        message: "No posts found for this user",
        status: "ERROR",
        payload: null,
      });
    }

    res.status(200).json({
      message: "Posts fetched successfully",
      status: "SUCCESS",
      payload: userPosts,
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Failed to fetch posts due to server error",
      status: "ERROR",
      payload: null,
    });
  }
};

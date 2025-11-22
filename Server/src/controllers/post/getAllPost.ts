import { PostModel } from "@/models";
import { Request, Response } from "express";

export const getAllPost = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const posts = await PostModel.find().sort({ createdAt: -1 }).lean();

    res.status(200).json({
      message:
        posts.length > 0 ? "Posts fetched successfully" : "No posts found",
      payload: posts,
      status: "SUCCESS",
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Failed to fetch posts",
      payload: null,
      status: "ERROR",
    });
  }
};

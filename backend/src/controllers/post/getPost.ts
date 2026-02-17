import { PostModel } from "@/models";
import mongoose from "mongoose";
import { Request, Response } from "express";

const getPost = async (req: Request, res: Response): Promise<any> => {
  const postId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({
      message: "Post ID format not valid",
      status: "ERROR",
      payload: null,
    });
  }

  try {
    const post = await PostModel.findById(postId).lean();

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
        status: "ERROR",
        payload: null,
      });
    }

    res.status(200).json({
      message: "Post fetched successfully",
      status: "SUCCESS",
      payload: post,
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Failed to get post due to server error",
      status: "ERROR",
      payload: null,
    });
  }
};

export default getPost;

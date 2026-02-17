import { PostModel, PostLikeModel } from "@/models";
import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyAuthToken";
import mongoose from "mongoose";

export const getAllPost = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id; // Logged-in user

  try {
    const posts = await PostModel.find()
      .sort({ createdAt: -1 })
      .select("_id authorId content likeCount createdAt postImage status")
      .lean();

    // Map likedByMe for current user
    const postsWithLikes = await Promise.all(
      posts.map(async (post) => {
        let likedByMe = false;
        if (userId) {
          likedByMe = !!(await PostLikeModel.exists({
            postId: new mongoose.Types.ObjectId(post._id),
            userId,
          }));
        }
        return { ...post, likedByMe };
      })
    );

    res.status(200).json({
      message:
        posts.length > 0 ? "Posts fetched successfully" : "No posts found",
      payload: postsWithLikes,
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

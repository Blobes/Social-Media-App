import mongoose from "mongoose";
import { PostModel, UserModel } from "@/models";
import { Request, Response } from "express";

export const getFollowersPosts = async (
  req: Request,
  res: Response
): Promise<any> => {
  const targetUserId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({
      message: "Invalid user ID format",
      status: "ERROR",
      payload: null,
    });
  }

  try {
    // Fetch the current user to get their following list
    const currentUser = await UserModel.findById(targetUserId).select(
      "following"
    );
    if (!currentUser) {
      return res.status(404).json({
        message: "User not found",
        status: "ERROR",
        payload: null,
      });
    }

    // Build array of userIds: the current user + all users they follow
    const userIdsToFetch = [targetUserId, ...(currentUser.following || [])];

    // Fetch posts from these users, sorted newest first
    const posts = await PostModel.find({
      userId: {
        $in: userIdsToFetch.map((id) => new mongoose.Types.ObjectId(id)),
      },
    }).sort({ createdAt: -1 });

    if (posts.length === 0) {
      return res.status(404).json({
        message: "No posts found from user or their followers",
        status: "ERROR",
        payload: [],
      });
    }

    return res.status(200).json({
      message: "Posts retrieved successfully",
      status: "SUCCESS",
      payload: posts,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Server error fetching posts",
      status: "ERROR",
      payload: null,
    });
  }
};

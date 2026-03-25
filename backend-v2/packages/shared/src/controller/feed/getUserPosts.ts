import mongoose from "mongoose";
import { Response } from "express";
import { GistModel } from "@repo/database";
import { getStaticPostList } from "../../utils/pipelines/postList";
import { IAuthRequest } from "../../types/types";

/**
 * Fetches all posts (Gists & Stakes) for a specific user profile.
 */
export const getUserPosts = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const targetUserId = req.params.id as string; // The profile owner
  const authUserId = req.user?.id; // The person viewing the profile (for likedByMe status)

  // 1. Validation: Use the isValid check before casting
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({
      status: "ERROR",
      payload: null,
      message: "User ID format is not valid",
    });
  }

  try {
    // 2. Pagination setup
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // 3. Define the Filter: Restrict to ONLY the target user's posts
    // We explicitly cast the ID to a String before the ObjectId constructor
    // to avoid the deprecated number signature warning.
    const matchFilter = {
      authorId: new mongoose.Types.ObjectId(String(targetUserId)),
      status: "ACTIVE",
    };

    // 4. Execute the Unified Aggregation
    const pipeline = getStaticPostList({
      matchFilter,
      userId: authUserId, // Allows the viewer to see if they've liked this user's posts
      limit,
      skip,
    });

    const userPosts = await GistModel.aggregate(pipeline);

    // 5. Response handling
    // We return 200 with an empty array if no posts exist (Standard UX)
    return res.status(200).json({
      message:
        userPosts.length > 0
          ? "Posts fetched successfully"
          : "No posts found for this user",
      status: "SUCCESS",
      payload: userPosts,
      meta: {
        count: userPosts.length,
        page,
        limit,
      },
    });
  } catch (error: any) {
    console.error("Get User Posts Error:", error);
    return res.status(500).json({
      status: "ERROR",
      payload: null,
      message: error.message || "Failed to fetch posts due to server error",
    });
  }
};

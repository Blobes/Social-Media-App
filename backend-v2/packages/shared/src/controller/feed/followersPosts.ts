import mongoose from "mongoose";
import { Response } from "express";
import { FollowModel, GistModel } from "@repo/database";
import { getPostListAggregation } from "../../utils/aggregator/postList";
import { IAuthRequest } from "../../types/types";

export const getfollowersPosts = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const authUserId = req.user?.id;

  if (!authUserId) {
    return res.status(401).json({
      message: "Unauthorized access",
      status: "ERROR",
      payload: null,
    });
  }

  try {
    const followingDocs = await FollowModel.find({
      followerId: new mongoose.Types.ObjectId(String(authUserId)),
    }).select("followingId");

    // 2. Build the array of IDs (Following only, as per your strict requirement)
    // If you want to include your own posts, add: new mongoose.Types.ObjectId(authUserId)
    const ids = followingDocs.map(
      (doc: any) => new mongoose.Types.ObjectId(String(doc.followingId)),
    );

    // If the user isn't following anyone yet, we can return early to save DB resources.
    if (ids.length === 0) {
      return res.status(200).json({
        message:
          "Your followers feed is empty. Follow more users to see posts!",
        status: "SUCCESS",
        payload: [],
        meta: { count: 0, page: 1, limit: 20 },
      });
    }

    // 3. Setup Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    // 4. Execute the Unified Aggregation
    // The aggregator handles the $unionWith for Gists and Stakes automatically.
    const pipeline = getPostListAggregation({
      matchFilter: {
        authorId: { $in: ids },
        status: "ACTIVE", // Recommended to avoid showing deleted/hidden content
      },
      userId: authUserId,
      limit,
      skip,
    });

    const posts = await GistModel.aggregate(pipeline);

    // 5. Response handling
    return res.status(200).json({
      message:
        posts.length > 0 ? "Posts retrieved successfully" : "No posts found",
      status: "SUCCESS",
      payload: posts,
      meta: {
        count: posts.length,
        page,
        limit,
      },
    });
  } catch (error: any) {
    console.error("Follower List Error:", error);
    return res.status(500).json({
      status: "ERROR",
      payload: null,
      message: error.message || "Server error fetching posts",
    });
  }
};

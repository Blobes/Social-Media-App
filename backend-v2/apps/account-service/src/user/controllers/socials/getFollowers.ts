import mongoose from "mongoose";
import { Response } from "express";
import {
  IAuthRequest,
  getUserListAggregation,
  getOrSetCache,
  decorateUserSocial,
} from "@repo/shared";
import { FollowModel } from "@repo/database";

export const getFollowers = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const targetUserId = req.params.id as string;
  const authUserId = req.user?.id;

  // Fail fast on invalid ID formats
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({
      message: "User ID format is not valid",
      status: "ERROR",
      payload: null,
    });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Use a generic cache key to maximize hit rate across all visitors
    const cacheKey = `user:followers:${targetUserId}:p:${page}:l:${limit}`;

    // 1. Fetch the "Neutral" list from Cache or MongoDB
    const neutralFollowers = await getOrSetCache(
      cacheKey,
      async () => {
        const result = await FollowModel.aggregate([
          // Initial filter on the relationship collection
          {
            $match: {
              followingId: new mongoose.Types.ObjectId(String(targetUserId)),
            },
          },
          // Join with Users collection to get the profile of the follower
          {
            $lookup: {
              from: "users",
              localField: "followerId",
              foreignField: "_id",
              as: "followerDetails",
            },
          },
          { $unwind: "$followerDetails" },
          // Promote follower details to the top level for the aggregator
          { $replaceRoot: { newRoot: "$followerDetails" } },

          // Apply standardized formatting and generic aggregation
          ...getUserListAggregation({
            matchFilter: {},
            skip,
            limit,
          }),
        ]);
        return result;
      },
      600, // Cache for 10 minutes
    );

    // 2. Decorate the list with the current viewer's social context
    // This adds 'isFollowing' and 'followsMe' dynamically in Node.js
    const finalFollowers = await decorateUserSocial(
      neutralFollowers,
      authUserId,
    );

    return res.status(200).json({
      message:
        finalFollowers.length > 0
          ? "Followers fetched successfully"
          : "No followers found",
      status: "SUCCESS",
      payload: finalFollowers,
      meta: {
        page,
        limit,
        count: finalFollowers.length,
      },
    });
  } catch (error: any) {
    console.error("Get Followers Error:", error);
    return res.status(500).json({
      message: error.message || "Failed to fetch followers",
      status: "ERROR",
      payload: null,
    });
  }
};

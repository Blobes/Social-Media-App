import mongoose from "mongoose";
import { Response } from "express";
import { IAuthRequest, getUserListAggregation } from "@repo/shared";
import { FollowModel } from "@repo/database";

export const getFollowers = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const targetUserId = req.params.id as string;
  const authUserId = req.user?.id; // Viewer context for isFollowing

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

    // We start with the FollowModel to find everyone following the targetUserId
    const followers = await FollowModel.aggregate([
      // 1. Initial filter on the relationship collection
      {
        $match: {
          followingId: new mongoose.Types.ObjectId(String(targetUserId)),
        },
      },

      // 2. Join with the Users collection to get the profile of the "follower"
      {
        $lookup: {
          from: "users",
          localField: "followerId",
          foreignField: "_id",
          as: "followerDetails",
        },
      },

      // 3. Flatten the joined user array
      { $unwind: "$followerDetails" },

      // 4. Transform the document so the followerDetails are at the top level.
      // This is crucial so our User Aggregator can find fields like firstName, lastName, etc.
      { $replaceRoot: { newRoot: "$followerDetails" } },

      // 5. Apply the User List Aggregator logic (Social context + Formatting)
      ...getUserListAggregation({
        matchFilter: {}, // Already filtered by the FollowModel match above
        authUserId,
        skip,
        limit,
      }),
    ]);

    return res.status(200).json({
      message:
        followers.length > 0
          ? "Followers fetched successfully"
          : "No followers found",
      status: "SUCCESS",
      payload: followers,
      meta: {
        page,
        limit,
        count: followers.length,
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

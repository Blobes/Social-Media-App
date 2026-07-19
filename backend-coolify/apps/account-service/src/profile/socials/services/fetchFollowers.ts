import mongoose from "mongoose";
import { FollowModel } from "@repo/database";
import {
  getStaticUserList,
  userSocialLookup,
  CACHE_KEYS,
  TransInfo,
  MESSAGES_REGISTRY,
  getOrSetCache,
} from "@repo/shared";

interface IGetFollowersInput {
  targetUserId: string;
  authUserId?: string;
  page: number;
  limit: number;
}

interface IGetFollowersResult {
  status: "SUCCESS";
  transInfo: TransInfo;
  payload: any[];
}

/**
 * Orchestrates cached pipeline lookups for follower records and decorates viewer-dependent graph metadata.
 */
export const executeFollowersFetch = async (
  input: IGetFollowersInput,
): Promise<IGetFollowersResult> => {
  const { targetUserId, authUserId, page, limit } = input;
  const skip = (page - 1) * limit;

  // Use a generic cache key to maximize hit rate across all visitors
  const cacheKey = CACHE_KEYS.USER_FOLLOWERS(targetUserId, page, limit);

  // Fetch the neutral list from cache or MongoDB aggregation pipeline
  const neutralFollowers = await getOrSetCache(
    cacheKey,
    async () => {
      const result = await FollowModel.aggregate([
        {
          $match: {
            followingId: new mongoose.Types.ObjectId(String(targetUserId)),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "followerId",
            foreignField: "_id",
            as: "followerDetails",
          },
        },
        { $unwind: "$followerDetails" },
        { $replaceRoot: { newRoot: "$followerDetails" } },

        // Apply standardized formatting and generic aggregation
        ...getStaticUserList({
          matchFilter: {},
          skip,
          limit,
        }),
      ]);
      return result;
    },
    600, // Cache for 10 minutes
  );

  // Decorate the list with the current viewer's social context
  const finalFollowers = await userSocialLookup(neutralFollowers, authUserId);

  const hasFollowers = finalFollowers.length > 0;

  return {
    status: "SUCCESS",
    transInfo: hasFollowers
      ? MESSAGES_REGISTRY.PROFILE.FOLLOWERS_FETCH_SUCCESS
      : MESSAGES_REGISTRY.PROFILE.NO_FOLLOWER_FOUND,
    payload: finalFollowers,
  };
};

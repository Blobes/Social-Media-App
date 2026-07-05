import mongoose from "mongoose";
import { FollowModel, GistModel, IPostStatus } from "@repo/database";
import {
  getStaticPostList,
  getOrSetCache,
  getPostSocialData,
  getOrSetCacheSet,
  getUserPreferences,
  personalizeFeed,
  CACHE_KEYS,
  MESSAGES_REGISTRY,
  TransInfo,
} from "@repo/shared";
import { hydrateSocialState } from "../syncPost";

export interface GetAllPostInput {
  userId?: string;
  page: number;
  limit: number;
  userContext: any;
}

export interface GetAllPostResult {
  status: "SUCCESS";
  transInfo: TransInfo;
  payload: any[];
  meta: {
    totalDocs: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
  };
}

/**
 * Handles global feed aggregation pipeline, handling multi-tier static caching, user blocklist filtering, and multi-collection social state hydration.
 */
export const executeGetAllPost = async (
  input: GetAllPostInput,
): Promise<GetAllPostResult> => {
  const { userId, page, limit, userContext } = input;
  const skip = (page - 1) * limit;

  const globalCacheKey = CACHE_KEYS.GLOBAL_FEED(page, limit);

  const { staticPosts, totalCount } = await getOrSetCache(
    globalCacheKey,
    async () => {
      const matchFilter = { status: "PUBLISHED" as IPostStatus };
      const total = await GistModel.countDocuments(matchFilter);

      const pipeline = getStaticPostList({
        matchFilter,
        limit,
        skip,
      });

      const data = await GistModel.aggregate(pipeline);
      return { staticPosts: data, totalCount: total };
    },
    600,
  );

  const totalPages = Math.ceil(totalCount / limit);

  if (!staticPosts || staticPosts.length === 0) {
    return {
      status: "SUCCESS",
      transInfo: MESSAGES_REGISTRY.POST.GLOBAL_FEED_FETCHED_SUCCESSFULLY,
      payload: [],
      meta: {
        totalDocs: totalCount,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: false,
      },
    };
  }

  let candidatePosts = staticPosts.slice(0, limit);
  let socialMap = new Map();

  if (userId && candidatePosts.length > 0) {
    const userPreferences = await getUserPreferences(userId, userContext);

    candidatePosts = personalizeFeed(staticPosts, userPreferences).slice(
      0,
      limit,
    );

    const postIdsObjects = candidatePosts.map(
      (p: any) => new mongoose.Types.ObjectId(String(p._id)),
    );

    const socialData = await GistModel.aggregate([
      { $match: { _id: { $in: postIdsObjects } } },
      { $addFields: { postType: "GIST" } },
      {
        $unionWith: {
          coll: "stakes",
          pipeline: [
            { $match: { _id: { $in: postIdsObjects } } },
            { $addFields: { postType: "STAKE" } },
          ],
        },
      },
      { $sort: { __order: 1 } },
      ...getPostSocialData({ userId: String(userId) }),
    ]);

    socialMap = new Map(socialData.map((s) => [String(s._id), s]));
  }

  const finalPayload = hydrateSocialState(candidatePosts, socialMap);
  const hasNextPage = page < totalPages;

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.POST.GLOBAL_FEED_FETCHED_SUCCESSFULLY,
    payload: finalPayload,
    meta: {
      totalDocs: totalCount,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage,
    },
  };
};

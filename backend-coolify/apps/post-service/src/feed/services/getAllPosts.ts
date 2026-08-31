import mongoose from "mongoose";
import { GistModel } from "@repo/database";
import {
  getCandidatePostPipeline,
  getPostSocialData,
  getUserPreferences,
  MESSAGES_REGISTRY,
  TransInfo,
  CACHE_KEYS,
  CACHE_EXPIRY,
  getCacheSortedSet,
  setCacheSortedSet,
  applyFeedDiversityRules,
} from "@repo/shared";
import { hydrateSocialState } from "../syncPost";

export interface GetAllPostInput {
  userId?: string;
  page: number;
  limit: number;
}

export interface GetAllPostResult {
  status: "SUCCESS";
  transInfo: TransInfo;
  payload: unknown[];
  meta: {
    totalDocs: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
  };
}

/**
 * Handles feed retrieval using CacheService ZSET candidate indices, DB heuristics, and diversity re-ranking.
 */
export const executeGetAllPost = async (
  input: GetAllPostInput,
): Promise<GetAllPostResult> => {
  const { userId, page, limit } = input;
  const skip = (page - 1) * limit;

  let candidatePosts: Record<string, unknown>[] = [];

  // Determine key: user-specific feed key or global unauthenticated feed key
  const feedCacheKey = userId
    ? CACHE_KEYS.USER_FEED(userId)
    : CACHE_KEYS.GLOBAL_FEED(page, limit);

  // Step 1: Read Candidate Index from Redis ZSET
  const cachedPostIds = await getCacheSortedSet(
    feedCacheKey,
    skip,
    skip + limit - 1,
  );

  if (cachedPostIds.length > 0) {
    const objectIds = cachedPostIds.map(
      (id) => new mongoose.Types.ObjectId(id),
    );

    // Hydrate posts matching the cached order
    candidatePosts = await GistModel.aggregate([
      { $match: { _id: { $in: objectIds } } },
      {
        $addFields: {
          __order: { $indexOfArray: [cachedPostIds, { $toString: "$_id" }] },
        },
      },
      { $sort: { __order: 1 } },
    ]);
  }

  // Step 2: Fallback to MongoDB Candidate Pipeline on Cache Miss
  if (candidatePosts.length === 0) {
    const userPrefs = userId ? await getUserPreferences(userId) : null;

    // Fetch a candidate buffer to populate the ZSET index
    const fetchLimit = Math.max(100, skip + limit);
    const candidatePipeline = getCandidatePostPipeline({
      userPrefs,
      limit: fetchLimit,
      skip: 0,
    });

    const rawCandidates = await GistModel.aggregate(candidatePipeline);

    if (!rawCandidates || rawCandidates.length === 0) {
      return {
        status: "SUCCESS",
        transInfo: MESSAGES_REGISTRY.POST.GLOBAL_FEED_FETCHED_SUCCESSFULLY,
        payload: [],
        meta: {
          totalDocs: 0,
          totalPages: 0,
          currentPage: page,
          limit,
          hasNextPage: false,
        },
      };
    }

    // Step 3: Populate Redis ZSET Candidate Cache for both guest and authenticated users
    const scoredItems = rawCandidates.map((post: Record<string, unknown>) => ({
      member: String(post._id),
      score: (post.heuristicScore as number) || 0,
    }));

    await setCacheSortedSet(feedCacheKey, scoredItems, CACHE_EXPIRY.MIN_20);

    candidatePosts = rawCandidates.slice(skip, skip + limit);
  }

  // Step 4: Hydrate User Social Data (Likes, Follows)
  let socialMap = new Map<string, Record<string, unknown>>();
  if (userId && candidatePosts.length > 0) {
    const postIdsObjects = candidatePosts.map(
      (p) => new mongoose.Types.ObjectId(String(p._id)),
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
      ...getPostSocialData({ userId }),
    ]);

    socialMap = new Map(socialData.map((s) => [String(s._id), s]));
  }

  // Step 5: Final Hydration & Author Diversity Rules
  const hydratedPosts = hydrateSocialState(candidatePosts, socialMap);
  const finalPayload = applyFeedDiversityRules(hydratedPosts, {
    maxConsecutiveByAuthor: 2,
  });

  const estimatedTotal = 100;

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.POST.GLOBAL_FEED_FETCHED_SUCCESSFULLY,
    payload: finalPayload,
    meta: {
      totalDocs: estimatedTotal,
      totalPages: Math.ceil(estimatedTotal / limit),
      currentPage: page,
      limit,
      hasNextPage: finalPayload.length === limit,
    },
  };
};

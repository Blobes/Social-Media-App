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
} from "@repo/shared";
import { hydrateSocialState } from "@/feed/syncPost";

export interface GetGistListInput {
  userId?: string;
  page: number;
  limit: number;
}

export interface GetGistListResult {
  status: "SUCCESS_EMPTY" | "SUCCESS_FETCHED";
  transInfo: TransInfo;
  payload: Record<string, unknown>[];
  meta: {
    totalDocs: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
  };
}

/**
 * Handles Gist feed list retrieval using Redis ZSET candidate indices, DB candidate pipelines, and social state hydration.
 */
export const executeGetGistList = async (
  input: GetGistListInput,
): Promise<GetGistListResult> => {
  const { userId, page, limit } = input;
  const skip = (page - 1) * limit;

  let candidateGists: Record<string, unknown>[] = [];
  const gistFeedCacheKey = CACHE_KEYS.SPECIFIC_POST_FEED("Gist", userId);

  // Read Candidate Index from Redis ZSET
  const cachedGistIds = await getCacheSortedSet(
    gistFeedCacheKey,
    skip,
    skip + limit - 1,
  );

  if (cachedGistIds.length > 0) {
    const objectIds = cachedGistIds.map(
      (id) => new mongoose.Types.ObjectId(id),
    );

    // Hydrate Gists matching cached order
    candidateGists = await GistModel.aggregate([
      { $match: { _id: { $in: objectIds } } },
      {
        $addFields: {
          __order: { $indexOfArray: [cachedGistIds, { $toString: "$_id" }] },
        },
      },
      { $sort: { __order: 1 } },
    ]);
  }

  // Fallback to MongoDB Candidate Pipeline on Cache Miss
  if (candidateGists.length === 0) {
    const userPrefs = userId ? await getUserPreferences(userId) : null;

    // Fetch candidate buffer to populate Redis index
    const fetchLimit = Math.max(100, skip + limit);
    const candidatePipeline = getCandidatePostPipeline({
      userPrefs,
      postType: "GIST",
      limit: fetchLimit,
      skip: 0,
    });

    const rawCandidates = await GistModel.aggregate(candidatePipeline);

    if (!rawCandidates || rawCandidates.length === 0) {
      return {
        status: "SUCCESS_EMPTY",
        transInfo: MESSAGES_REGISTRY.POST.POSTS_FETCHED_SUCCESSFULLY("Gist"),
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

    // Populate Redis ZSET Candidate Cache
    const scoredItems = rawCandidates.map((gist: Record<string, unknown>) => ({
      member: String(gist._id),
      score: (gist.heuristicScore as number) || 0,
    }));

    await setCacheSortedSet(gistFeedCacheKey, scoredItems, CACHE_EXPIRY.MIN_20);

    candidateGists = rawCandidates.slice(skip, skip + limit);
  }

  if (candidateGists.length === 0) {
    return {
      status: "SUCCESS_EMPTY",
      transInfo: MESSAGES_REGISTRY.POST.POSTS_FETCHED_SUCCESSFULLY("Gist"),
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

  // Hydrate User Social Data
  let socialMap = new Map<string, Record<string, unknown>>();

  if (userId && candidateGists.length > 0) {
    const gistIdsObjects = candidateGists.map(
      (g) => new mongoose.Types.ObjectId(String(g._id)),
    );

    const socialData = await GistModel.aggregate([
      { $match: { _id: { $in: gistIdsObjects } } },
      { $addFields: { postType: "GIST" } },
      ...getPostSocialData({ userId }),
    ]);

    socialMap = new Map(
      (socialData || []).map((s) => [
        String(s._id),
        s as Record<string, unknown>,
      ]),
    );
  }

  // Final Social Hydration
  const finalPayload = hydrateSocialState(candidateGists, socialMap);
  const estimatedTotal = 100;

  return {
    status: "SUCCESS_FETCHED",
    transInfo: MESSAGES_REGISTRY.POST.POSTS_FETCHED_SUCCESSFULLY("Gist"),
    payload: finalPayload,
    meta: {
      totalDocs: estimatedTotal,
      totalPages: Math.ceil(estimatedTotal / limit),
      currentPage: page,
      limit,
      hasNextPage: skip + finalPayload.length < estimatedTotal,
    },
  };
};

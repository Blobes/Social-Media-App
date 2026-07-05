import mongoose from "mongoose";
import { GistModel } from "@repo/database";
import {
  getStaticPostList,
  getOrSetCache,
  getPostSocialData,
  personalizeFeed,
  getUserPreferences,
  CACHE_KEYS,
  MESSAGES_REGISTRY,
  TransInfo,
} from "@repo/shared";
import { hydrateSocialState } from "@/feed/syncPost";

export interface GetGistListInput {
  userId?: string;
  userRawPayload?: any;
  page: number;
  limit: number;
}

export interface GetGistListResult {
  status: "SUCCESS_EMPTY" | "SUCCESS_FETCHED";
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
 * Handles feed list generation by coordinating static aggregate cache layers, sorting user social states, and executing feed personalization calculations.
 */
export const executeGetGistList = async (
  input: GetGistListInput,
): Promise<GetGistListResult> => {
  const { userId, userRawPayload, page, limit } = input;
  const skip = (page - 1) * limit;

  const globalCacheKey = CACHE_KEYS.POST_FEED_TYPE("GIST", page, limit);

  const cachedData = (await getOrSetCache(globalCacheKey, async () => {
    const total = await GistModel.countDocuments({ status: "PUBLISHED" });
    const pipeline = getStaticPostList({
      matchFilter: { status: "PUBLISHED" },
      postType: "GIST",
      limit: limit + 5,
      skip,
    });
    const data = await GistModel.aggregate(pipeline);
    return { staticGists: data, totalCount: total };
  })) || { staticGists: [], totalCount: 0 };

  const { staticGists, totalCount } = cachedData;

  const totalPages = Math.ceil(totalCount / limit);

  if (!staticGists || staticGists.length === 0) {
    return {
      status: "SUCCESS_EMPTY",
      transInfo: MESSAGES_REGISTRY.POST.POSTS_FETCHED_SUCCESSFULLY("Gist"),
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

  let candidateGists = staticGists.slice(0, limit);
  let socialMap = new Map();

  if (userId) {
    const gistIdsAsObjects = candidateGists.map(
      (g: any) => new mongoose.Types.ObjectId(String(g._id)),
    );

    const gistIdsAsStrings = candidateGists.map((g: any) => String(g._id));

    const socialData = await GistModel.aggregate([
      { $match: { _id: { $in: gistIdsAsObjects } } },
      { $addFields: { postType: "GIST", stringId: { $toString: "$_id" } } },
      {
        $addFields: {
          __order: { $indexOfArray: [gistIdsAsStrings, "$stringId"] },
        },
      },
      { $sort: { __order: 1 } },
      ...getPostSocialData({ userId: String(userId) }),
    ]);

    socialMap = new Map((socialData || []).map((s) => [String(s._id), s]));

    const userPreferences = await getUserPreferences(userId, userRawPayload);
    candidateGists = personalizeFeed(staticGists, userPreferences).slice(
      0,
      limit,
    );
  }

  const finalPayload = hydrateSocialState(candidateGists, socialMap);

  return {
    status: "SUCCESS_FETCHED",
    transInfo: MESSAGES_REGISTRY.POST.POSTS_FETCHED_SUCCESSFULLY("Gist"),
    payload: finalPayload,
    meta: {
      totalDocs: totalCount,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: skip + finalPayload.length < totalCount,
    },
  };
};

import mongoose from "mongoose";
import { GistModel } from "@repo/database";
import {
  getPostStaticData,
  getOrSetCache,
  getPostSocialData,
  CACHE_KEYS,
  MESSAGES_REGISTRY,
  TransInfo,
} from "@repo/shared";

export interface GetGistInput {
  postId: string;
  userId?: string;
}

export interface GetGistResult {
  status: "INVALID_ID" | "NOT_FOUND" | "SUCCESS_STATIC" | "SUCCESS_HYDRATED";
  transInfo: TransInfo;
  payload: any;
}

/**
 * Handles aggregation lookups across caching and database infrastructure layouts to construct fully hydrated post records.
 */
export const executeGetGist = async (
  input: GetGistInput,
): Promise<GetGistResult> => {
  const { postId, userId } = input;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return {
      status: "INVALID_ID",
      transInfo: MESSAGES_REGISTRY.POST.INVALID_POST_ID,
      payload: null,
    };
  }

  const cacheKey = CACHE_KEYS.POST("GIST", postId);

  const cachedGist = await getOrSetCache(cacheKey, async () => {
    const result = await GistModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(postId),
          status: "PUBLISHED",
        },
      },
      { $addFields: { postType: "GIST" } },
      ...getPostStaticData(),
    ]);
    return result.length > 0 ? result[0] : null;
  });

  if (!cachedGist) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.POST.POST_NOT_FOUND("Gist"),
      payload: null,
    };
  }

  if (!userId) {
    return {
      status: "SUCCESS_STATIC",
      transInfo:
        MESSAGES_REGISTRY.POST.POST_DETAIL_FETCHED_SUCCESSFULLY("Gist"),
      payload: cachedGist,
    };
  }

  const socialStatus = await GistModel.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(postId) } },
    { $addFields: { postType: "GIST" } },
    ...getPostSocialData({ userId: String(userId) }),
  ]);

  const finalResult = {
    ...cachedGist,
    likedByMe: socialStatus[0]?.likedByMe || false,
    author: {
      ...cachedGist.author,
      isFollowing: socialStatus[0]?.isFollowing || false,
      followsMe: socialStatus[0]?.followsMe || false,
    },
  };

  return {
    status: "SUCCESS_HYDRATED",
    transInfo:
      MESSAGES_REGISTRY.POST.POST_FETCHED_AND_HYDRATED_SUCCESSFULLY("Gist"),
    payload: finalResult,
  };
};

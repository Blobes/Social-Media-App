import mongoose from "mongoose";
import { GistModel, IPostStatus } from "@repo/database";
import {
  getStaticPostList,
  getOrSetCache,
  getPostSocialData,
  CACHE_KEYS,
  MESSAGES_REGISTRY,
  TransInfo,
} from "@repo/shared";

export interface GetUserPostsInput {
  targetUserId: string;
  authUserId?: string;
  page: number;
  limit: number;
}

export interface GetUserPostsResult {
  status: "INVALID_ID" | "SUCCESS";
  transInfo: TransInfo;
  payload: any[];
  meta?: {
    totalDocs: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
  };
}

/**
 * Handles author profile post lookups by checking static Redis layer keys and performing social status hydration if a viewing identity is provided.
 */
export const executeGetUserPosts = async (
  input: GetUserPostsInput,
): Promise<GetUserPostsResult> => {
  const { targetUserId, authUserId, page, limit } = input;
  const skip = (page - 1) * limit;

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return {
      status: "INVALID_ID",
      transInfo: MESSAGES_REGISTRY.POST.INVALID_USER_ID_FORMAT,
      payload: [],
    };
  }

  const profileCacheKey = CACHE_KEYS.USER_PROFILE_FEED(
    targetUserId,
    page,
    limit,
  );

  const { staticPosts, totalCount } = await getOrSetCache(
    profileCacheKey,
    async () => {
      const matchFilter = {
        authorId: new mongoose.Types.ObjectId(String(targetUserId)),
        status: "PUBLISHED" as IPostStatus,
      };

      const total = await GistModel.countDocuments(matchFilter);
      const pipeline = getStaticPostList({
        matchFilter,
        limit,
        skip,
      });

      const data = await GistModel.aggregate(pipeline);
      return { staticPosts: data, totalCount: total };
    },
    900,
  );

  const totalPages = Math.ceil(totalCount / limit);

  if (!staticPosts || staticPosts.length === 0) {
    return {
      status: "SUCCESS",
      transInfo: MESSAGES_REGISTRY.POST.USER_POSTS_RETRIEVED_SUCCESSFULLY,
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

  let finalPayload = staticPosts;

  if (authUserId) {
    const postIds = staticPosts.map((p: any) => p._id);

    const socialData = await GistModel.aggregate([
      {
        $match: {
          _id: {
            $in: postIds.map((id: string) => new mongoose.Types.ObjectId(id)),
          },
        },
      },
      { $addFields: { postType: "GIST" } },
      { $addFields: { __order: { $indexOfArray: [postIds, "$_id"] } } },
      { $sort: { __order: 1 } },
      ...getPostSocialData({ userId: String(authUserId) }),
    ]);

    finalPayload = staticPosts.map((post: any, index: number) => {
      const social = socialData[index];
      return {
        ...post,
        likedByMe: social?.likedByMe || false,
        author: {
          ...post.author,
          isFollowing: social?.isFollowing || false,
          followsMe: social?.followsMe || false,
        },
      };
    });
  }

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.POST.USER_POSTS_RETRIEVED_SUCCESSFULLY,
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

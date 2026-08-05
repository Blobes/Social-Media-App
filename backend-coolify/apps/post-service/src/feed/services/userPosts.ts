import mongoose from "mongoose";
import { GistModel, PostStatus } from "@repo/database";
import {
  getStaticPostList,
  getPostSocialData,
  MESSAGES_REGISTRY,
  TransInfo,
  CACHE_KEYS,
  CACHE_EXPIRY,
  getCacheSortedSet,
  setCacheSortedSet,
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
  payload: Record<string, unknown>[];
  meta?: {
    totalDocs: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
  };
}

/**
 * Handles author profile post lookups using ZSET candidate indices and social status hydration.
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

  let candidatePosts: Record<string, unknown>[] = [];
  const profileCacheKey = CACHE_KEYS.USER_PROFILE_FEED(targetUserId);

  // Attempt to fetch candidate post IDs from Redis ZSET candidate index
  const cachedPostIds = await getCacheSortedSet(
    profileCacheKey,
    skip,
    skip + limit - 1,
  );

  if (cachedPostIds.length > 0) {
    const objectIds = cachedPostIds.map(
      (id) => new mongoose.Types.ObjectId(id),
    );

    // Hydrate candidate posts while preserving exact score ranking order
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

  // Database fallback on cache miss to build fresh candidate ZSET
  if (candidatePosts.length === 0) {
    const matchFilter = {
      authorId: new mongoose.Types.ObjectId(String(targetUserId)),
      status: "PUBLISHED" as PostStatus,
    };

    const fetchLimit = 100;
    const pipeline = getStaticPostList({
      matchFilter,
      limit: fetchLimit,
      skip: 0,
    });

    const rawCandidates = await GistModel.aggregate(pipeline);

    if (!rawCandidates || rawCandidates.length === 0) {
      return {
        status: "SUCCESS",
        transInfo: MESSAGES_REGISTRY.POST.USER_POSTS_RETRIEVED_SUCCESSFULLY,
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

    // Compute timestamp scores for candidates to populate Redis ZSET index
    const scoredItems = rawCandidates.map((post: Record<string, unknown>) => {
      const createdAt = post.createdAt
        ? new Date(post.createdAt as string | Date).getTime()
        : Date.now();

      return {
        member: String(post._id),
        score: createdAt,
      };
    });

    await setCacheSortedSet(profileCacheKey, scoredItems, CACHE_EXPIRY.MIN_20);

    candidatePosts = rawCandidates.slice(skip, skip + limit);
  }

  if (candidatePosts.length === 0) {
    return {
      status: "SUCCESS",
      transInfo: MESSAGES_REGISTRY.POST.USER_POSTS_RETRIEVED_SUCCESSFULLY,
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

  let finalPayload = candidatePosts;

  // Hydrate personalized social state if viewing identity is present
  if (authUserId) {
    const postIds = candidatePosts.map((p) => String(p._id));
    const postObjectIds = postIds.map((id) => new mongoose.Types.ObjectId(id));

    const socialData = await GistModel.aggregate([
      { $match: { _id: { $in: postObjectIds } } },
      { $addFields: { postType: "GIST" } },
      {
        $addFields: {
          __order: { $indexOfArray: [postIds, { $toString: "$_id" }] },
        },
      },
      { $sort: { __order: 1 } },
      ...getPostSocialData({ userId: String(authUserId) }),
    ]);

    const socialMap = new Map<string, Record<string, unknown>>(
      socialData.map((item) => [String(item._id), item]),
    );

    finalPayload = candidatePosts.map((post) => {
      const postId = String(post._id);
      const social = socialMap.get(postId);
      const author = (post.author as Record<string, unknown>) || {};

      return {
        ...post,
        likedByMe: (social?.likedByMe as boolean) || false,
        author: {
          ...author,
          isFollowing: (social?.isFollowing as boolean) || false,
          followsMe: (social?.followsMe as boolean) || false,
        },
      };
    });
  }

  const estimatedTotal = 100;

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.POST.USER_POSTS_RETRIEVED_SUCCESSFULLY,
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

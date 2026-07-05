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

export interface GetFollowersPostsInput {
  authUserId: string;
  page: number;
  limit: number;
  userContext: any;
}

export interface GetFollowersPostsResult {
  status: "SUCCESS" | "EMPTY_FEED";
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
 * Orchestrates pagination, Redis cache validation, personalization filters, and social data hydration for a user followers feed.
 */
export const executeGetFollowersPosts = async (
  input: GetFollowersPostsInput,
): Promise<GetFollowersPostsResult> => {
  const { authUserId, page, limit, userContext } = input;
  const skip = (page - 1) * limit;

  const followingIds = await getOrSetCacheSet(
    `user:${authUserId}:following`,
    async () => {
      const docs = await FollowModel.find({
        followerId: new mongoose.Types.ObjectId(String(authUserId)),
      })
        .select("followingId")
        .lean();
      return docs.map((doc) => String(doc.followingId));
    },
  );

  if (!followingIds || followingIds.length === 0) {
    return {
      status: "EMPTY_FEED",
      transInfo: MESSAGES_REGISTRY.POST.FOLLOWERS_FEED_EMPTY,
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

  const cacheKey = CACHE_KEYS.USER_FOLLOWERS_FEED(authUserId, page, limit);

  const { staticPosts, totalCount } = await getOrSetCache(
    cacheKey,
    async () => {
      const matchFilter = {
        authorId: {
          $in: followingIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
        status: "PUBLISHED" as IPostStatus,
      };

      const total = await GistModel.countDocuments(matchFilter);
      const pipeline = getStaticPostList({
        matchFilter,
        limit: limit + 5,
        skip,
      });

      const data = await GistModel.aggregate(pipeline);
      return { staticPosts: data, totalCount: total };
    },
    300,
  );

  if (!staticPosts?.length) {
    return {
      status: "SUCCESS",
      transInfo: MESSAGES_REGISTRY.POST.FOLLOWERS_FEED_FETCHED_SUCCESSFULLY,
      payload: [],
      meta: {
        totalDocs: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
        hasNextPage: false,
      },
    };
  }

  const userPreferences = await getUserPreferences(
    String(authUserId),
    userContext,
  );
  const personalizedPosts = personalizeFeed(staticPosts, userPreferences);

  const candidatePosts = personalizedPosts.slice(0, limit);
  const postIds = candidatePosts.map((p: any) => p._id);

  const socialData = await GistModel.aggregate([
    {
      $match: {
        _id: { $in: postIds.map((id) => new mongoose.Types.ObjectId(id)) },
      },
    },
    { $addFields: { __order: { $indexOfArray: [postIds, "$_id"] } } },
    { $sort: { __order: 1 } },
    ...getPostSocialData({ userId: String(authUserId) }),
  ]);

  const finalPayload = candidatePosts.map((post: any, index: number) => ({
    ...post,
    likedByMe: socialData[index]?.likedByMe || false,
    author: {
      ...post.author,
      isFollowing: true,
      followsMe: socialData[index]?.followsMe || false,
    },
  }));

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.POST.FOLLOWERS_FEED_FETCHED_SUCCESSFULLY,
    payload: finalPayload,
    meta: {
      totalDocs: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      limit,
      hasNextPage: skip + finalPayload.length < totalCount,
    },
  };
};

import mongoose from "mongoose";
import { Response } from "express";
import { FollowModel, GistModel } from "@repo/database";
import {
  IAuthRequest,
  getStaticPostList,
  getOrSetCache,
  getPostSocialData,
  getOrSetCacheSet,
  getUserPreferences,
  personalizeFeed,
  CACHE_KEYS,
} from "@repo/shared";

export const getfollowersPosts = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const authUserId = req.user?.id;

  if (!authUserId) {
    return res
      .status(401)
      .json({ status: "ERROR", message: "Unauthorized access" });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    // --- 1. GET FOLLOWING LIST (Cached in Redis Set) ---
    // This is much faster than querying FollowModel on every page load
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
      return res.status(200).json({
        status: "SUCCESS",
        payload: [],
        message: "Follow more users to see posts here!",
        meta: { totalDocs: 0, currentPage: page },
      });
    }

    // --- 2. GET STATIC POSTS (Global Cache) ---
    // We cache the static content common to anyone following these users
    // Note: This key includes the authUserId because "Followers Feed" is unique to the viewer
    const cacheKey = CACHE_KEYS.USER_FOLLOWERS_FEED(authUserId, page, limit);

    const { staticPosts, totalCount } = await getOrSetCache(
      cacheKey,
      async () => {
        const matchFilter = {
          authorId: {
            $in: followingIds.map((id) => new mongoose.Types.ObjectId(id)),
          },
          status: "PUBLISHED", // Use the correct status from your schema
        };

        const total = await GistModel.countDocuments(matchFilter);
        const pipeline = getStaticPostList({
          matchFilter,
          limit: limit + 5, // Small buffer
          skip,
        });

        const data = await GistModel.aggregate(pipeline);
        return { staticPosts: data, totalCount: total };
      },
      300, // 5 minute TTL is usually safe for followers feeds
    );

    if (!staticPosts?.length) {
      return res.status(200).json({
        status: "SUCCESS",
        payload: [],
        meta: { totalDocs: totalCount },
      });
    }

    // --- 3. PERSONALIZATION & HYDRATION ---
    // Even in a followers feed, we rank by topics and hide blocked/sensitive content
    const userPreferences = await getUserPreferences(
      String(authUserId),
      req.user,
    );
    const personalizedPosts = personalizeFeed(staticPosts, userPreferences);

    const candidatePosts = personalizedPosts.slice(0, limit);
    const postIds = candidatePosts.map((p: any) => p._id);

    // Dynamic Social Hydration (Likes/Follows)
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
        isFollowing: true, // They are in the followers feed, so this is always true
        followsMe: socialData[index]?.followsMe || false,
      },
    }));

    // --- 4. RESPONSE ---
    return res.status(200).json({
      status: "SUCCESS",
      payload: finalPayload,
      message: "Followers feed fetched successfully",
      meta: {
        totalDocs: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
        hasNextPage: skip + finalPayload.length < totalCount,
      },
    });
  } catch (error: any) {
    console.error("Followers Feed Error:", error);
    return res
      .status(500)
      .json({ status: "ERROR", message: "Internal Server Error" });
  }
};

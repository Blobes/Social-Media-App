import { GistModel } from "@repo/database";
import {
  IAuthRequest,
  getStaticPostList,
  getOrSetCache,
  getPostSocialData,
  getUserPreferences,
  personalizeFeed,
  CACHE_KEYS,
} from "@repo/shared";
import { Response } from "express";
import mongoose from "mongoose";
import { hydrateSocialState } from "../syncPost";

export const getAllPost = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const userId = req.user?.id;

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // --- 1. GLOBAL STATIC CACHE ---
    // We cache the raw posts for 5-10 mins since this feed is the same for everyone initially
    const globalCacheKey = CACHE_KEYS.GLOBAL_FEED(page, limit);

    const { staticPosts, totalCount } = await getOrSetCache(
      globalCacheKey,
      async () => {
        const matchFilter = { status: "PUBLISHED" }; // Aligned with your GistSchema status
        const total = await GistModel.countDocuments(matchFilter);

        const pipeline = getStaticPostList({
          matchFilter,
          limit: limit + 15, // Buffer for personalization/blocking filter
          skip,
        });

        const data = await GistModel.aggregate(pipeline);
        return { staticPosts: data, totalCount: total };
      },
      600, // 10 minute TTL
    );

    if (!staticPosts || staticPosts.length === 0) {
      return res.status(200).json({
        status: "SUCCESS",
        payload: [],
        meta: { totalDocs: totalCount, currentPage: page },
      });
    }

    // --- 2. PERSONALIZATION & FILTERING ---
    let finalPayload = staticPosts;

    if (userId) {
      // Fetch Preferences + Blocks (Parallel DB/Redis hit via utility)
      const userPreferences = await getUserPreferences(
        String(userId),
        req.user,
      );

      // Rank by topics/location and filter out blocked users
      const personalizedPosts = personalizeFeed(staticPosts, userPreferences);

      // Trim to requested page size
      const candidatePosts = personalizedPosts.slice(0, limit);
      const postIds = candidatePosts.map((p: any) => p._id);

      // --- 3. DYNAMIC SOCIAL HYDRATION ---
      // Fetch "likedByMe" and "isFollowing" for the survivors
      const socialData = await GistModel.aggregate([
        {
          $match: {
            _id: { $in: postIds.map((id) => new mongoose.Types.ObjectId(id)) },
          },
        },
        { $addFields: { __order: { $indexOfArray: [postIds, "$_id"] } } },
        { $sort: { __order: 1 } },
        ...getPostSocialData({ userId: String(userId) }),
      ]);

      // Convert to Map for O(1) lookup in the helper
      const socialMap = new Map(socialData.map((s) => [String(s._id), s]));

      // Merge real-time social flags into the cached static objects
      finalPayload = hydrateSocialState(candidatePosts, socialMap);
    }
    // --- 4. RESPONSE ---
    return res.status(200).json({
      status: "SUCCESS",
      payload: finalPayload,
      message: "Global feed fetched successfully",
      meta: {
        totalDocs: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
        hasNextPage: skip + finalPayload.length < totalCount,
      },
    });
  } catch (error: any) {
    console.error("Global Feed Error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Internal Server Error",
    });
  }
};

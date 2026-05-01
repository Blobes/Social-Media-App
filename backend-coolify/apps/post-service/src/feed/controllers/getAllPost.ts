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
          limit: limit, // Buffer for personalization/blocking filter
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
    let candidatePosts = staticPosts.slice(0, limit);
    let socialMap = new Map();

    if (userId && candidatePosts.length > 0) {
      const userPreferences = await getUserPreferences(userId, req.user);

      // 1. Personalize first
      candidatePosts = personalizeFeed(staticPosts, userPreferences).slice(
        0,
        limit,
      );

      // 2. Get IDs
      const postIdsObjects = candidatePosts.map(
        (p) => new mongoose.Types.ObjectId(String(p._id)),
      );

      // 3. Fetch social data across multiple collections
      const socialData = await GistModel.aggregate([
        // Start with Gists
        { $match: { _id: { $in: postIdsObjects } } },
        { $addFields: { postType: "GIST" } }, // Inject the type so the decorator knows what to do

        // Pull in Stakes
        {
          $unionWith: {
            coll: "stakes",
            pipeline: [
              { $match: { _id: { $in: postIdsObjects } } },
              { $addFields: { postType: "STAKE" } }, // Inject type for Stakes
            ],
          },
        },
        { $sort: { __order: 1 } },

        // 4. Now that we have all docs + their types, run the social logic
        // This will keep likeCount/commentCount intact from the DB
        ...getPostSocialData({ userId: String(userId) }),
      ]);

      socialMap = new Map(socialData.map((s) => [String(s._id), s]));
    }

    const finalPayload = hydrateSocialState(candidatePosts, socialMap);

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;

    // --- 4. RESPONSE ---
    return res.status(200).json({
      status: "SUCCESS",
      payload: finalPayload,
      message: "Global feed fetched successfully",
      meta: {
        totalDocs: totalCount,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage,
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

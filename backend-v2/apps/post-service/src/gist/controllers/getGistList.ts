import { GistModel } from "@repo/database";
import {
  IAuthRequest,
  getStaticPostList,
  getOrSetCache,
  getPostSocialData,
  personalizeFeed,
  getUserPreferences,
  CACHE_KEYS,
} from "@repo/shared";
import { Response } from "express";
import mongoose from "mongoose";

export const getGistList = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const userId = req.user?.id as string;

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // --- 1. GLOBAL CACHE LAYER (Shared across all users) ---
    const globalCacheKey = CACHE_KEYS.POST_TYPE_FEED("GIST", page, limit);

    const { staticGists, totalCount } = await getOrSetCache(
      globalCacheKey,
      async () => {
        const total = await GistModel.countDocuments({ status: "ACTIVE" });
        const pipeline = getStaticPostList({
          matchFilter: { status: "ACTIVE" },
          postType: "GIST",
          limit: limit + 10, // Buffer for personalization filtering
          skip,
        });

        const data = await GistModel.aggregate(pipeline);
        return { staticGists: data, totalCount: total };
      },
    );

    // Early exit if no data
    if (!staticGists || staticGists.length === 0) {
      return res.status(200).json({
        status: "SUCCESS",
        payload: [],
        meta: { totalDocs: totalCount, currentPage: page },
      });
    }

    // --- 2. PERSONALIZATION LAYER (Unique to this user) ---
    let finalPayload = staticGists;
    if (userId) {
      const userPreferences = await getUserPreferences(userId, req.user);
      // Rank and Filter
      const personalizedGists = personalizeFeed(staticGists, userPreferences);

      // Trim to the actual requested page size
      const candidateGists = personalizedGists.slice(0, limit);
      const gistIds = candidateGists.map((g: any) => g._id);

      // --- 3. DYNAMIC HYDRATION (Social Flags) ---
      // This query hits only the indexes for the specific posts shown
      const socialData = await GistModel.aggregate([
        {
          $match: {
            _id: { $in: gistIds.map((id) => new mongoose.Types.ObjectId(id)) },
          },
        },
        { $addFields: { postType: "GIST" } },
        { $addFields: { __order: { $indexOfArray: [gistIds, "$_id"] } } },
        { $sort: { __order: 1 } },
        ...getPostSocialData({ userId: String(userId) }),
      ]);

      // Merge Social Booleans (Likes/Follows) into the Personalized Gists
      finalPayload = candidateGists.map((gist: any, index: number) => {
        const social = socialData[index];
        return {
          ...gist,
          likedByMe: social?.likedByMe || false,
          author: {
            ...gist.author,
            isFollowing: social?.isFollowing || false,
            followsMe: social?.followsMe || false,
          },
        };
      });
    }
    // --- 4. RESPONSE ---
    return res.status(200).json({
      status: "SUCCESS",
      payload: finalPayload,
      message: "Gists fetched successfully",
      meta: {
        totalDocs: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
        hasNextPage: skip + finalPayload.length < totalCount,
      },
    });
  } catch (error: any) {
    console.error("Fetch Gists List Error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Internal Server Error",
    });
  }
};

import { GistModel } from "@repo/database";
import {
  IAuthRequest,
  getStaticPostList,
  getOrSetCache,
  getPostSocialData,
  CACHE_KEYS,
} from "@repo/shared";
import { Response } from "express";
import mongoose from "mongoose";

/**
 * Fetches all posts for a specific user profile with high-speed caching.
 */
export const getUserPosts = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const targetUserId = req.params.id as string;
  const authUserId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({
      status: "ERROR",
      message: "Invalid User ID format",
    });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // --- 1. AUTHOR-SPECIFIC STATIC CACHE ---
    // Cache the posts of this specific user so every visitor gets a fast load
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
          status: "PUBLISHED", // Aligned with your GistSchema
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
      900, // 15 minute TTL (Profiles change less frequently than global feeds)
    );

    if (!staticPosts || staticPosts.length === 0) {
      return res.status(200).json({
        status: "SUCCESS",
        payload: [],
        meta: { totalDocs: totalCount, currentPage: page },
      });
    }

    // --- 2. DYNAMIC SOCIAL HYDRATION ---
    let finalPayload = staticPosts;

    if (authUserId) {
      const postIds = staticPosts.map((p: any) => p._id);

      // Fetch viewer-specific interaction data (Liked? Following author?)
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

    // --- 3. RESPONSE ---
    return res.status(200).json({
      status: "SUCCESS",
      payload: finalPayload,
      message: "User posts retrieved successfully",
      meta: {
        totalDocs: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
        hasNextPage: skip + finalPayload.length < totalCount,
      },
    });
  } catch (error: any) {
    console.error("Get User Posts Error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Internal Server Error",
    });
  }
};

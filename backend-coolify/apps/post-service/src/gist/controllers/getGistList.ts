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
  const userId = req.user?.id;

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const globalCacheKey = CACHE_KEYS.POST_FEED_TYPE("GIST", page, limit);

    const cachedData = (await getOrSetCache(globalCacheKey, async () => {
      const total = await GistModel.countDocuments({ status: "PUBLISHED" });
      const pipeline = getStaticPostList({
        matchFilter: { status: "PUBLISHED" },
        postType: "GIST",
        limit: limit + 10,
        skip,
      });
      const data = await GistModel.aggregate(pipeline);
      return { staticGists: data, totalCount: total };
    })) || { staticGists: [], totalCount: 0 };

    const { staticGists, totalCount } = cachedData;

    if (!staticGists || staticGists.length === 0) {
      return res.status(200).json({
        status: "SUCCESS",
        payload: [],
        meta: { totalDocs: totalCount, currentPage: page },
      });
    }

    let candidateGists = staticGists.slice(0, limit);
    let socialMap = new Map(); // Setup Social Map (Only if logged in)

    // Logic for logged in user
    if (userId) {
      //  Ensure IDs are handled as ObjectIds for the $match
      // but kept as Strings for the $indexOfArray comparison.
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
      // Map the social data back using a Map for O(1) lookup to prevent index errors
      socialMap = new Map((socialData || []).map((s) => [String(s._id), s]));

      // Apply personalization if logged in
      const userPreferences = await getUserPreferences(userId, req.user);
      candidateGists = personalizeFeed(staticGists, userPreferences).slice(
        0,
        limit,
      );
    }

    const finalPayload = candidateGists.map((gist: any) => {
      const gistIdStr = String(gist._id);
      const social = socialMap.get(gistIdStr);
      const gistObj = gist.toObject ? gist.toObject() : gist;
      return {
        ...gistObj,

        likeCount: social ? social.likeCount : (gistObj.likeCount ?? 0),
        commentCount: social
          ? social.commentCount
          : (gistObj.commentCount ?? 0),
        viewCount: social ? social.viewCount : (gistObj.viewCount ?? 0),
        likedByMe: social?.likedByMe ?? false,

        author: {
          ...(gistObj.author || {}),
          isFollowing: social?.isFollowing ?? false,
          followsMe: social?.followsMe ?? false,
        },
      };
    });

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
    console.error("Fetch Gists List Error Details:", error);
    return res.status(500).json({
      status: "ERROR",
      message: error.message || "Internal Server Error",
    });
  }
};

//  invalidatePattern(CACHE_KEYS.WILDCARD_POST_FEED_TYPE("GIST"));

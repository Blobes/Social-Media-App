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

    const globalCacheKey = CACHE_KEYS.POST_TYPE_FEED("GIST", page, limit);

    const cachedData = await getOrSetCache(globalCacheKey, async () => {
      const total = await GistModel.countDocuments({ status: "ACTIVE" });
      const pipeline = getStaticPostList({
        matchFilter: { status: "ACTIVE" },
        postType: "GIST",
        limit: limit + 10,
        skip,
      });

      const data = await GistModel.aggregate(pipeline);
      return { staticGists: data, totalCount: total };
    });

    const { staticGists, totalCount } = cachedData;

    if (!staticGists || staticGists.length === 0) {
      return res.status(200).json({
        status: "SUCCESS",
        payload: [],
        meta: { totalDocs: totalCount, currentPage: page },
      });
    }

    let finalPayload = staticGists.slice(0, limit);

    if (userId) {
      const userPreferences = await getUserPreferences(userId, req.user);
      const personalizedGists = personalizeFeed(staticGists, userPreferences);
      const candidateGists = personalizedGists.slice(0, limit);

      // CRITICAL FIX: Ensure IDs are handled as ObjectIds for the $match
      // but kept as Strings for the $indexOfArray comparison.

      const gistIdsAsObjects = candidateGists.map(
        (g: any) => new mongoose.Types.ObjectId(String(g._id)),
      );
      const gistIdsAsStrings = candidateGists.map((g: any) => String(g._id));

      const socialData = await GistModel.aggregate([
        {
          $match: {
            _id: { $in: gistIdsAsObjects },
          },
        },
        // Converting the document _id to string so it matches the gistIdsAsStrings array type
        {
          $addFields: {
            postType: "GIST",
            stringId: { $toString: "$_id" },
          },
        },
        {
          $addFields: {
            __order: { $indexOfArray: [gistIdsAsStrings, "$stringId"] },
          },
        },
        { $sort: { __order: 1 } },
        ...getPostSocialData({ userId: String(userId) }),
      ]);

      // Map the social data back using a Map for O(1) lookup to prevent index errors
      const socialMap = new Map(socialData.map((s) => [String(s._id), s]));

      finalPayload = candidateGists.map((gist: any) => {
        const social = socialMap.get(String(gist._id));
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

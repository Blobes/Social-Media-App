import { GistModel } from "@repo/database";
import {
  IAuthRequest,
  getPostStaticData,
  getOrSetCache,
  getPostDynamicData,
} from "@repo/shared";
import { Response } from "express";
import mongoose from "mongoose";

const getGist = async (req: IAuthRequest, res: Response): Promise<void> => {
  const postId = req.params.id as string;
  const userId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    res.status(400).json({ status: "ERROR", message: "Invalid Post ID" });
    return;
  }

  try {
    const cacheKey = `post:gist:${postId}`;

    // STEP 1: Get the Static/Formatted data from Cache (or DB if miss)
    // This caches the heavy author lookups and polymorphic formatting
    const cachedGist = await getOrSetCache(cacheKey, async () => {
      const result = await GistModel.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(postId),
            status: "ACTIVE",
          },
        },
        { $addFields: { postType: "GIST" } },
        ...getPostStaticData(), // Purely static structure logic
      ]);
      return result.length > 0 ? result[0] : null;
    });

    if (!cachedGist) {
      res.status(404).json({ status: "ERROR", message: "Gist not found" });
      return;
    }

    // STEP 2: If no user, return the static cached data immediately
    if (!userId) {
      res.status(200).json({
        status: "SUCCESS",
        payload: cachedGist,
        message: "Gist fetched successfully",
      });
      return;
    }

    // STEP 3: Fetch ONLY the dynamic social bits for the logged-in user
    // This hits the lightweight likes and follows collections
    const socialStatus = await GistModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(postId) } },
      { $addFields: { postType: "GIST" } },
      ...getPostDynamicData({ userId: String(userId) }), // Real-time social logic
    ]);

    // STEP 4: Merge the real-time social flags into the cached static payload
    const finalResult = {
      ...cachedGist,
      likedByMe: socialStatus[0]?.likedByMe || false,
      author: {
        ...cachedGist.author,
        isFollowing: socialStatus[0]?.isFollowing || false,
        followsMe: socialStatus[0]?.followsMe || false,
      },
    };

    res.status(200).json({
      status: "SUCCESS",
      payload: finalResult,
      message: "Gist fetched and hydrated successfully",
    });
  } catch (error: any) {
    console.error("Get Gist Error:", error);
    res.status(500).json({ status: "ERROR", message: "Internal Server Error" });
  }
};

export default getGist;

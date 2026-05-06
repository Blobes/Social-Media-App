import { GistModel, StakeModel, PostViewModel } from "@repo/database";
import {
  IAuthRequest,
  CACHE_KEYS,
  invalidateCache,
  PostType,
} from "@repo/shared";
import { Response } from "express";
import mongoose from "mongoose";

/**
 * Mapping of post types to their respective database models.
 */
const postModelMap: Record<string, mongoose.Model<any>> = {
  GIST: GistModel,
  STAKE: StakeModel,
};

/**
 * Handles unique views, increments global counters, and invalidates cache.
 */
export const markPostAsSeen = async (req: IAuthRequest, res: Response) => {
  const { id } = req.params;
  const { postType } = req.body as { postType: PostType };
  const userId = req.user?.id;

  /**
   * Cast ID to string to resolve the "string | string[]" TypeScript error.
   */
  const postId = String(id);

  if (!userId) {
    return res.status(401).json({ status: "ERROR", message: "Unauthorized" });
  }

  const MainModel = postModelMap[postType?.toUpperCase()];
  if (!MainModel) {
    return res
      .status(400)
      .json({ status: "ERROR", message: "Invalid postType" });
  }

  try {
    /**
     * Check for existing view to ensure uniqueness.
     */
    const existingView = await PostViewModel.findOne({ postId, userId }).lean();

    if (existingView) {
      /**
       * Update only the timestamp if already seen.
       */
      await MainModel.findByIdAndUpdate(postId, {
        $set: { lastViewed: new Date() },
      });

      return res.status(200).json({
        status: "SUCCESS",
        message: "Timestamp updated",
        payload: null,
      });
    }

    /**
     * Record new unique view and increment counter.
     */
    await PostViewModel.create({ postId, userId, postType });

    const updatedPost = await MainModel.findByIdAndUpdate(
      postId,
      {
        $set: { lastViewed: new Date() },
        $inc: { viewCount: 1 },
      },
      { new: true, lean: true },
    ).select("viewCount");

    /**
     * Invalidate the specific post cache to ensure the new viewCount is reflected.
     */
    invalidateCache(CACHE_KEYS.POST(postType, postId));

    return res.status(201).json({
      status: "SUCCESS",
      message: "Unique view recorded",
      payload: {
        viewCount: updatedPost?.viewCount ?? 0,
      },
    });
  } catch (error: any) {
    /**
     * Handle Mongo race conditions (Parallel requests passing the first check).
     */
    if (error.code === 11000) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "View already recorded",
        payload: null,
      });
    }

    console.error(`[ViewService Error]: ${error.message}`);
    return res.status(500).json({
      status: "ERROR",
      message: error.message,
      payload: null,
    });
  }
};

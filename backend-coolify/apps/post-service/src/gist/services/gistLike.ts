import mongoose from "mongoose";
import { GistLikeModel, GistModel } from "@repo/database";
import {
  CACHE_KEYS,
  invalidateCache,
  MESSAGES_REGISTRY,
  TransInfo,
} from "@repo/shared";

export interface GistLikeInput {
  gistId: string;
  userId?: string;
}

export interface GistLikeResult {
  status:
    | "INVALID_SESSION"
    | "INVALID_ID"
    | "NOT_FOUND"
    | "SUCCESS_LIKED"
    | "SUCCESS_UNLIKED";
  transInfo: TransInfo;
  payload: any;
}

/**
 * Toggles a user interaction like marker across specific post structures by executing atomic database counters and updating application cache.
 */
export const executeGistLike = async (
  input: GistLikeInput,
): Promise<GistLikeResult> => {
  const { gistId, userId } = input;

  if (!userId) {
    return {
      status: "INVALID_SESSION",
      transInfo: MESSAGES_REGISTRY.POST.INVALID_SESSION("Gist"),
      payload: null,
    };
  }

  if (!mongoose.Types.ObjectId.isValid(gistId)) {
    return {
      status: "INVALID_ID",
      transInfo: MESSAGES_REGISTRY.POST.INVALID_POST_ID,
      payload: null,
    };
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const gist = await GistModel.findById(gistId).session(session);
    if (!gist) {
      await session.abortTransaction();
      return {
        status: "NOT_FOUND",
        transInfo: MESSAGES_REGISTRY.POST.POST_NOT_FOUND("Gist"),
        payload: null,
      };
    }

    const existingLike = await GistLikeModel.findOne({
      gistId,
      userId,
    }).session(session);

    let isLiked: boolean;

    if (existingLike) {
      await GistLikeModel.deleteOne({ _id: existingLike._id }).session(session);

      await GistModel.updateOne(
        { _id: gistId },
        { $inc: { likeCount: -1 } },
        { session },
      );
      isLiked = false;
    } else {
      await GistLikeModel.create(
        [
          {
            gistId,
            userId,
          },
        ],
        { session },
      );

      await GistModel.updateOne(
        { _id: gistId },
        { $inc: { likeCount: 1 } },
        { session },
      );
      isLiked = true;
    }

    await session.commitTransaction();

    invalidateCache(CACHE_KEYS.POST("GIST", gistId));

    const updatedGist = await GistModel.findById(gistId)
      .select("likeCount")
      .lean();

    const finalPayload = {
      likedByMe: isLiked,
      likeCount: updatedGist?.likeCount ?? 0,
    };

    if (isLiked) {
      return {
        status: "SUCCESS_LIKED",
        transInfo: MESSAGES_REGISTRY.POST.POST_LIKED_SUCCESSFULLY("Gist"),
        payload: finalPayload,
      };
    }

    return {
      status: "SUCCESS_UNLIKED",
      transInfo: MESSAGES_REGISTRY.POST.POST_UNLIKED_SUCCESSFULLY("Gist"),
      payload: finalPayload,
    };
  } catch (error: any) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    session.endSession();
  }
};

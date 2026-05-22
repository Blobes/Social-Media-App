import { Request, Response } from "express";
import mongoose from "mongoose";
import { FinalizePostReq, POST_STRATEGIES } from "../helpers/postStrategies";
import { CACHE_KEYS, invalidatePattern } from "@repo/shared";

/**
 * Handles incoming transactional write payloads from the Go execution layer.
 */
export const handlePostFinalizer = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { postId, postType, userId, caption, media, modResult, event } =
    req.body as FinalizePostReq;

  // Dynamically compound the strategies matching mapping variants safely
  const strategyKey = `${postType}_${event}`;
  const strategy = POST_STRATEGIES[strategyKey as keyof typeof POST_STRATEGIES];

  if (!strategy) {
    res.status(400).json({
      error: `Unsupported type boundary variant match: ${strategyKey}`,
    });
    return;
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const updatedData = await strategy.finalizer({
      postId,
      userId,
      postType,
      caption,
      media,
      modResult,
      event,
      session,
    });

    await session.commitTransaction();

    if (modResult.status === "PUBLISHED" || modResult.status === "ACTIVE") {
      Promise.all([
        invalidatePattern(CACHE_KEYS.WILDCARD_USER_FEED_ALL(userId)),
      ]).catch((err) => {
        console.error(`Post-commit cache invalidation failure: ${err.message}`);
      });
    }

    res.status(200).json({ success: true, data: updatedData });
  } catch (error: any) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error(`Internal engine transaction failure: ${error.message}`);
    res.status(500).json({ error: "State update transaction failed" });
  } finally {
    session.endSession();
  }
};

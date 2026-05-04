// apps/worker/processors/moderation.ts
import { Worker, Job } from "bullmq";
import mongoose from "mongoose";
import {
  invalidatePattern,
  CACHE_KEYS,
  validatePost,
  InternalSocketEmitter,
  QueueService,
} from "@repo/shared";
import { POST_STRATEGIES } from "@/helpers/postStrategies";
import { FUNSTAKES_REDIS_URL, OPENAI_API_KEY } from "@/envVars";

export const postModerationWorker = () => {
  const redisConnection = QueueService.getConnection(FUNSTAKES_REDIS_URL);

  const worker = new Worker(
    "moderation-queue",
    async (job: Job) => {
      const { postId, type, userId, caption, media, topics, skipModeration } =
        job.data;

      const strategy = POST_STRATEGIES[type as keyof typeof POST_STRATEGIES];
      if (!strategy) {
        console.error(`❌ Unsupported post type: ${type}`);
        return;
      }

      const { model, finalizer, displayName } = strategy;

      // 1. Shell Check
      const shell = await model.findById(postId);
      if (!shell) {
        console.warn(
          `⚠️ ${displayName} shell ${postId} not found. Retrying...`,
        );
        throw new Error("Shell not found");
      }

      // 2. Phase 1: Moderation
      const modResult = await validatePost(OPENAI_API_KEY, {
        caption,
        media,
        topics,
        skipModeration,
      });

      if (modResult.status === "BANNED") {
        await model.findByIdAndDelete(postId);
        await InternalSocketEmitter.notifyUser(
          userId,
          "CONTENT_REJECTED",
          {
            postId,
            type,
            reason: modResult.reason || "Safety violation",
          },
          FUNSTAKES_REDIS_URL,
        );
        return;
      }

      // 3. Phase 2: DB Finalization (Transaction)
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        const finalizedData = await finalizer({
          postId,
          userId,
          caption,
          media,
          modResult,
          session,
        });

        await session.commitTransaction();

        // 4. Phase 3: Post-Commit Effects
        await Promise.all([
          InternalSocketEmitter.notifyUser(
            userId,
            "POST_STATUS_UPDATE",
            {
              postId,
              type,
              status: modResult.status,
              payload: finalizedData,
            },
            FUNSTAKES_REDIS_URL,
          ),
          modResult.status === "PUBLISHED"
            ? invalidatePattern(CACHE_KEYS.WILDCARD_USER_FEED_ALL(userId))
            : Promise.resolve(),
        ]);

        console.log(
          `✅ ${displayName} ${postId} processed as ${modResult.status}`,
        );
      } catch (error) {
        if (session.inTransaction()) await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    },
    {
      connection: redisConnection,
      concurrency: 5,
    },
  );

  worker.on("failed", (job, err) => {
    console.error(`❌ Moderation job ${job?.id} failed: ${err.message}`);
  });

  return worker;
};

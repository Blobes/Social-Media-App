import mongoose from "mongoose";
import { GistModel, PostCaptionModel } from "@repo/database";
import {
  createMediaBatch,
  hardDeleteMedia,
  InternalSocketEmitter,
} from "@repo/shared";
import { FUNSTAKES_REDIS_URL, s3Config } from "@/envVars";
import { FinalizePostParams } from "./postStrategies";

/**
 * Commits the finalized state from Go processing into MongoDB for initial post creation.
 */
export const finalizeGistCreation = async (params: FinalizePostParams) => {
  const { postId, userId, caption, media, modResult, session } = params;

  // 1. Creation Ban Flow: Drop temporary shell record and clean S3 staging buckets
  if (modResult.status === "BANNED") {
    const rawFileKeys =
      media?.map((item: any) => item.fileKey).filter(Boolean) || [];

    if (rawFileKeys.length > 0) {
      await hardDeleteMedia({
        rawFileKeys,
        s3Config,
      });
    }

    const droppedShell = await GistModel.findByIdAndDelete(postId, { session });

    try {
      await InternalSocketEmitter.notifyUser(
        userId,
        "CONTENT_REJECTED",
        {
          postId,
          type: "GIST",
          event: "POST_CREATION",
          reason: modResult.reason || "Safety violation profile detected.",
        },
        FUNSTAKES_REDIS_URL,
      );
    } catch (err) {
      console.error("Non-blocking creation ban socket broadcast failure:", err);
    }

    return droppedShell;
  }

  // 2. Successful Creation Flow: Process media records and save the first caption version
  const uploadedMediaIdsPromise = createMediaBatch(media, userId, session, {
    sourceId: new mongoose.Types.ObjectId(postId),
    sourceType: "GIST",
  });

  const captionPromise = PostCaptionModel.create(
    [
      {
        postId,
        postType: "GIST",
        caption: caption?.trim() || "",
        version: 1,
        isLatest: true,
      },
    ],
    { session },
  );

  const [uploadedMediaIds, [initialCaption]] = await Promise.all([
    uploadedMediaIdsPromise,
    captionPromise,
  ]);

  try {
    await InternalSocketEmitter.notifyUser(
      userId,
      "GIST_STATUS_UPDATE",
      {
        userId: userId.toString(),
        type: "GIST_PROCESSED",
        payload: {
          gistId: postId,
          status: modResult.status,
          hasSensitiveGraphic:
            modResult.severity === "CRITICAL" ||
            modResult.severity === "MODERATE",
        },
      },
      FUNSTAKES_REDIS_URL,
    );
  } catch (err) {
    console.error(
      "Non-blocking initialization websocket broadcast failure:",
      err,
    );
  }

  return await GistModel.findByIdAndUpdate(
    postId,
    {
      mediaIds: uploadedMediaIds,
      latestCaption: {
        captionId: initialCaption._id,
        caption: initialCaption.caption,
      },
      topics: modResult.topics,
      status: modResult.status,
      hasSensitiveGraphic:
        modResult.severity === "CRITICAL" || modResult.severity === "MODERATE",
    },
    { session, new: true, lean: true },
  );
};

/**
 * Commits updated text content versions to MongoDB after validation checks pass.
 */
export const finalizeGistUpdate = async (params: FinalizePostParams) => {
  const { postId, userId, caption, modResult, session } = params;

  // 1. Update Ban Flow: Notify user and reset post status back to active without saving the new text
  if (modResult.status === "BANNED") {
    try {
      await InternalSocketEmitter.notifyUser(
        userId,
        "CONTENT_REJECTED",
        {
          postId,
          type: "GIST",
          event: "POST_UPDATE",
          reason:
            modResult.reason ||
            "Updated text content violated safety guidelines.",
        },
        FUNSTAKES_REDIS_URL,
      );
    } catch (err) {
      console.error(
        "Non-blocking update validation socket broadcast failure:",
        err,
      );
    }

    // Reset post status back to active so it isn't stuck in UNDER_REVIEW
    return await GistModel.findByIdAndUpdate(
      postId,
      { $set: { status: "ACTIVE" } },
      { session, new: true, lean: true },
    );
  }

  // 2. Successful Update Flow: Fetch target to calculate incremented version constraints
  const gist = await GistModel.findById(postId).session(session);
  if (!gist) {
    throw new Error(
      `Target Gist container reference not found for update resolution: ${postId}`,
    );
  }

  // Safely compute the next version tracking number based on the upcoming incremented edit limit index
  const upcomingEditCount = (gist.editCount || 0) + 1;
  const nextVersion = upcomingEditCount + 1;

  const [newCaptionDoc] = await PostCaptionModel.create(
    [
      {
        postId,
        postType: "GIST",
        caption: caption?.trim() || "",
        version: nextVersion,
        isLatest: true,
      },
    ],
    { session },
  );

  // Set all older caption histories to legacy mode
  await PostCaptionModel.updateMany(
    { postId, postType: "GIST", _id: { $ne: newCaptionDoc._id } },
    { $set: { isLatest: false } },
    { session },
  );

  try {
    await InternalSocketEmitter.notifyUser(
      userId,
      "GIST_STATUS_UPDATE",
      {
        userId: userId.toString(),
        type: "GIST_UPDATED",
        payload: { gistId: postId, status: modResult.status },
      },
      FUNSTAKES_REDIS_URL,
    );
  } catch (err) {
    console.error(
      "Non-blocking caption update websocket broadcast failure:",
      err,
    );
  }

  return await GistModel.findByIdAndUpdate(
    postId,
    {
      $inc: { editCount: 1 },
      $set: {
        latestCaption: {
          captionId: newCaptionDoc._id,
          caption: newCaptionDoc.caption,
        },
        topics: modResult.topics,
        status: modResult.status,
      },
    },
    { session, new: true, lean: true },
  );
};

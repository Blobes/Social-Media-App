import mongoose from "mongoose";
import { GistModel, PostCaptionModel } from "@repo/database";
import { createMediaBatch } from "@repo/shared";
import { InternalSocketEmitter } from "@repo/shared";

export const finalizeGist = async (params: {
  gistId: string;
  userId: string;
  caption: string;
  media: any[];
  modResult: any;
  session: mongoose.ClientSession;
}) => {
  const { gistId, userId, caption, media, modResult, session } = params;

  // Create Media Batch (linked to the Gist ID)
  const uploadedMediaIds = await createMediaBatch(media, userId, session, {
    sourceId: new mongoose.Types.ObjectId(gistId),
    sourceType: "GIST",
  });

  // Create Caption Version (Original logic)
  const [initialCaption] = await PostCaptionModel.create(
    [
      {
        postId: gistId,
        postType: "GIST",
        caption: caption?.trim() || "",
        version: 1,
        isLatest: true,
      },
    ],
    { session },
  );

  const message = {
    userId: userId.toString(),
    type: "GIST_PROCESSED",
    payload: {
      gistId,
      status: modResult.status,
      moderation: modResult,
    },
  };
  // await redisConnection.publish("moderation_updates", message);
  try {
    await InternalSocketEmitter.notifyUser(
      userId,
      "GIST_STATUS_UPDATE",
      message,
    );
    console.log(`📡 Socket update sent to user:${userId}`);
  } catch (err) {
    console.error("Failed to emit socket event:", err); // We don't throw here because the DB work is already done;
  }

  // Update the Gist Container with AI findings
  return await GistModel.findByIdAndUpdate(
    gistId,
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
    { session },
  );
};

import mongoose from "mongoose";
import { GistModel, IMedia, PostCaptionModel, UserModel } from "@repo/database";
import { FinalizePostReq, IS3Config } from "../../types";
import { hardDeleteMedia } from "../../utils/media/hardDelete";
import { InternalSocketEmitter } from "../socket";
import { createMediaBatch } from "../../utils/media/createBatch";
import { executeTopicUpdate } from "../topic";
import { executePostFlag } from "./executePostFlag";
import { franc } from "franc-min";
import { to2ISOCode } from "../../utils/misc/constants";
import { topicsExtractor } from "../../utils/misc/topic";

interface Config {
  redisKey?: string;
  s3Config: IS3Config;
}
/**
 * Commits the finalized state from processing into MongoDB for initial post creation.
 */
export const finalizeGistCreation = async (
  params: FinalizePostReq,
  config: Config,
) => {
  const { postId, userId, caption, media, modResult, session } = params;

  if (modResult.status === "BANNED") {
    // Flag user for explicit safety violations
    await UserModel.findByIdAndUpdate(
      userId,
      { $set: { hasFlaggedPost: true } },
      { session },
    );

    const rawFileKeys =
      media?.map((item: IMedia) => item.fileKey).filter(Boolean) || [];

    if (rawFileKeys.length > 0) {
      await hardDeleteMedia({
        rawFileKeys,
        s3Config: config.s3Config,
      });
    }

    const droppedShell = await GistModel.findByIdAndDelete(postId, {
      session: session,
    });

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
        config.redisKey || "",
      );
    } catch (err) {
      console.error("Non-blocking creation ban socket broadcast failure:", err);
    }

    return droppedShell;
  }

  if (modResult.ruleViolated === "AI_ERROR") {
    const mediaUrls =
      media?.map((item: IMedia) => item.url).filter(Boolean) || [];

    // Route infrastructure exceptions to shadowban matrix without pinning blame on the user record
    await executePostFlag(
      {
        postId,
        postType: "GIST",
        authorId: userId.toString(),
        source: "AI",
        severity: modResult.severity,
        ruleViolated: "AI_ERROR",
        reason:
          modResult.reason ||
          "Automated escalation: AI processing pipeline experienced a terminal validation failure.",
        contentSnapshot: {
          text: caption || "",
          mediaIds: mediaUrls,
        },
      },
      null,
    );
  }

  const existingGistShell = await GistModel.findById(postId).session(
    session || null,
  );

  const determinedSensitiveGraphic =
    !!existingGistShell?.hasSensitiveGraphic || !!modResult.hasSensitiveGraphic;

  // Fallback to custom regex token extractor utility if the AI framework fails to populate metadata arrays
  let targetTopics = modResult.extractedTopics || [];
  if (targetTopics.length === 0 && caption) {
    targetTopics = topicsExtractor(caption);
  }

  if (targetTopics.length > 0) {
    await executeTopicUpdate(
      {
        topics: targetTopics,
        targetId: postId,
        targetModel: "Gist",
        actionType: "POST_CREATION_OR_UPDATE",
      },
      session,
    );
  }

  const uploadedMediaIdsPromise = createMediaBatch(media, userId, session, {
    sourceId: new mongoose.Types.ObjectId(postId),
    sourceType: "GIST",
  });

  const detectedIso3 = franc(caption, { minLength: 3 });
  const detectedIso2 = to2ISOCode(detectedIso3);
  const captionPromise = PostCaptionModel.create(
    [
      {
        postId,
        postType: "GIST",
        caption: caption?.trim() || "",
        detectedLanguage: detectedIso2,
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
          status:
            modResult.ruleViolated === "AI_ERROR"
              ? "SHADOWBANNED"
              : modResult.status,
          hasSensitiveGraphic: determinedSensitiveGraphic,
        },
      },
      config.redisKey || "",
    );
  } catch (err) {
    console.error(
      "Non-blocking initialization websocket broadcast failure:",
      err,
    );
  }

  // Increment trust window metrics on clean completions
  await UserModel.findByIdAndUpdate(
    userId,
    { $inc: { postCountWindow: 1 } },
    { session },
  );

  return await GistModel.findByIdAndUpdate(
    postId,
    {
      mediaIds: uploadedMediaIds,
      latestCaption: {
        captionId: initialCaption._id,
        caption: initialCaption.caption,
        detectedLanguage: detectedIso2,
      },
      topics: targetTopics.map((t) => t.trim().toLowerCase()),
      status:
        modResult.ruleViolated === "AI_ERROR"
          ? "SHADOWBANNED"
          : modResult.status,
      hasSensitiveGraphic: determinedSensitiveGraphic,
    },
    { session, new: true, lean: true },
  );
};

/**
 * Commits updated text content versions to MongoDB after validation checks pass.
 */
export const finalizeGistUpdate = async (
  params: FinalizePostReq,
  config: Config,
) => {
  const { postId, userId, caption, modResult, session } = params;

  if (modResult.status === "BANNED") {
    // Flag user for explicit safety violations
    await UserModel.findByIdAndUpdate(
      userId,
      { $set: { hasFlaggedPost: true } },
      { session },
    );

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
        config.redisKey || "",
      );
    } catch (err) {
      console.error(
        "Non-blocking update validation socket broadcast failure:",
        err,
      );
    }

    return await GistModel.findByIdAndUpdate(
      postId,
      { $set: { status: "PUBLISHED" } },
      { session, new: true, lean: true },
    );
  }

  const gist = await GistModel.findById(postId).session(session || null);
  if (!gist) {
    throw new Error(
      `Target Gist container reference not found for update resolution: ${postId}`,
    );
  }

  const determinedSensitiveGraphic =
    !!gist.hasSensitiveGraphic || !!modResult.hasSensitiveGraphic;

  let targetTopics = modResult.extractedTopics || [];
  if (targetTopics.length === 0 && caption) {
    targetTopics = topicsExtractor(caption);
  }

  if (targetTopics.length > 0) {
    await executeTopicUpdate(
      {
        topics: targetTopics,
        targetId: postId,
        targetModel: "Gist",
        actionType: "POST_CREATION_OR_UPDATE",
      },
      session,
    );
  }

  const upcomingEditCount = (gist.editCount || 0) + 1;
  const nextVersion = upcomingEditCount + 1;

  const detectedIso3 = franc(caption, { minLength: 3 });
  const detectedIso2 = to2ISOCode(detectedIso3);
  const [newCaptionDoc] = await PostCaptionModel.create(
    [
      {
        postId,
        postType: "GIST",
        caption: caption?.trim() || "",
        detectedLanguage: detectedIso2,
        version: nextVersion,
        isLatest: true,
      },
    ],
    { session },
  );

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
        payload: {
          gistId: postId,
          status:
            modResult.ruleViolated === "AI_ERROR"
              ? "SHADOWBANNED"
              : modResult.status,
        },
      },
      config.redisKey || "",
    );
  } catch (err) {
    console.error(
      "Non-blocking caption update websocket broadcast failure:",
      err,
    );
  }

  // Increment trust window metrics on clean updates
  await UserModel.findByIdAndUpdate(
    userId,
    { $inc: { postCountWindow: 1 } },
    { session },
  );

  await GistModel.findByIdAndUpdate(
    postId,
    {
      $inc: { editCount: 1 },
      $set: {
        latestCaption: {
          captionId: newCaptionDoc._id,
          caption: newCaptionDoc.caption,
          detectedLanguage: newCaptionDoc.detectedLanguage,
        },
        topics: targetTopics.map((t) => t.trim().toLowerCase()),
        status: modResult.status,
        hasSensitiveGraphic: determinedSensitiveGraphic,
      },
    },
    { session, new: true, lean: true },
  );

  if (modResult.ruleViolated === "AI_ERROR") {
    const mediaIds = gist.mediaIds?.map((id: any) => id.toString()) || [];

    // Process core shadowban rules without assigning penalty counters to the user's data model
    await executePostFlag(
      {
        postId,
        postType: "GIST",
        authorId: userId.toString(),
        source: "AI",
        severity: modResult.severity,
        ruleViolated: "AI_ERROR",
        reason:
          modResult.reason ||
          "Automated escalation: AI processing pipeline experienced a terminal validation failure during a text update cycle.",
        contentSnapshot: {
          text: caption || "",
          mediaIds,
        },
      },
      null,
    );
  }
  return;
};

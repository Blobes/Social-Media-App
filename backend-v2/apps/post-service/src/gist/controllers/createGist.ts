import mongoose from "mongoose";
import { Response } from "express";
import {
  IAuthRequest,
  createMediaBatch,
  IMediaInput,
  ISeverity,
  invalidatePattern,
  CACHE_KEYS,
} from "@repo/shared";
import { GistModel, PostCaptionModel } from "@repo/database";

interface CreateRequest extends IAuthRequest {
  body: {
    caption?: string;
    media?: IMediaInput[];
    hasSensitiveGraphic?: boolean;
  };
}

const createGist = async (req: CreateRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { caption, media, hasSensitiveGraphic } = req.body;

  const hasCaption = caption && caption.trim().length > 0;
  const hasMedia = media && Array.isArray(media) && media.length > 0;

  if (!hasCaption && !hasMedia) {
    res.status(400).json({
      status: "ERROR",
      message: "Post must contain either text content or media.",
    });
    return;
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // 1. Create Gist Container
    const [newGist] = await GistModel.create(
      [{ authorId: userId, mediaIds: [] }],
      { session },
    );

    // 2. Create media
    let uploadedMediaIds: mongoose.Types.ObjectId[] = [];
    if (hasMedia) {
      uploadedMediaIds = await createMediaBatch(media, userId, session, {
        sourceId: newGist._id as mongoose.Types.ObjectId,
        sourceType: "GIST",
      });
    }

    // 3. Create Caption Version
    const [initialContent] = await PostCaptionModel.create(
      [
        {
          postId: newGist._id,
          postType: "GIST",
          caption: hasCaption ? caption!.trim() : "",
          version: 1,
          isLatest: true,
        },
      ],
      { session },
    );

    // 4. Finalize the Container
    newGist.latestCaption = {
      captionId: initialContent._id,
      caption: initialContent.caption,
    };
    newGist.mediaIds = uploadedMediaIds;

    // Add topics
    newGist.topics = req.moderation?.topics || [];

    // 5. Apply AI Moderation Logic
    if (req.moderation?.severity === ISeverity.LOW) {
      newGist.status = "SHADOWBANNED";
    }
    const SENSITIVE_RULES = [
      "adult",
      "violence",
      "Severe Violence",
      "NSFW Media",
    ];
    newGist.hasSensitiveGraphic =
      hasSensitiveGraphic === true
        ? true
        : req.moderation
          ? SENSITIVE_RULES.includes(req.moderation.ruleViolated || "") &&
            req.moderation.severity === ISeverity.CRITICAL
          : false;

    await newGist.save({ session });

    // 6. Commit DB changes
    await session.commitTransaction();

    // CACHE INVALIDATION
    await Promise.all([
      invalidatePattern(CACHE_KEYS.WILDCARD_USER_FEED_ALL(userId)),
      invalidatePattern(CACHE_KEYS.GLOBAL_FEED_PAGE_ONE),
    ]);

    // Prepare moderation metadata for the client
    const moderation = req.moderation
      ? {
          extractedTopics: req.moderation.topics || [],
          needsReview: req.moderation.needsReview,
          severity: req.moderation.severity,
          ruleViolated: req.moderation.ruleViolated,
          reason: req.moderation.reason,
        }
      : null;

    res.status(201).json({
      status: "SUCCESS",
      payload: newGist,
      moderation,
      message: "Gist created successfully",
    });
  } catch (error: any) {
    if (session.inTransaction()) await session.abortTransaction();
    console.error("Error in createGist:", error);
    res.status(500).json({
      status: "ERROR",
      message: error.message || "Server error during gist creation",
    });
  } finally {
    session.endSession();
  }
};

export default createGist;

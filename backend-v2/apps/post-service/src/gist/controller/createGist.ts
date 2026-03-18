import mongoose from "mongoose";
import { Response } from "express";
import {
  IAuthRequest,
  createMediaBatch,
  IMediaInput,
  ISeverity,
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
      payload: null,
      message: "Post must contain either text content or media.",
    });
    return;
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Create Gist Container
    const [newGist] = await GistModel.create(
      [{ authorId: userId, mediaIds: [] }],
      { session },
    );

    // Create media
    let uploadedMediaIds: mongoose.Types.ObjectId[] = [];
    if (hasMedia) {
      uploadedMediaIds = await createMediaBatch(media, userId, session, {
        sourceId: newGist._id as mongoose.Types.ObjectId,
        sourceType: "GIST",
      });
    }

    // Create Caption Version
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

    //  Finalize the Container with references
    newGist.latestCaption = {
      captionId: initialContent._id,
      caption: initialContent.caption,
    };
    newGist.mediaIds = uploadedMediaIds;

    if (req.moderation?.severity && req.moderation.severity === ISeverity.LOW)
      newGist.status = "SHADOWBANNED";

    // Define which specific rules from the AI should trigger the blur
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

    await session.commitTransaction();

    // Moderation response
    const moderation = req.moderation
      ? {
          extractedTopics: req.moderation.topics || [], // For manage topic api
          needsReview: req.moderation.needsReview,
          severity: req.moderation.severity, // For flagged post api
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
      payload: null,
      message: error.message || "Server error during gist creation",
    });
  } finally {
    session.endSession();
  }
};

export default createGist;

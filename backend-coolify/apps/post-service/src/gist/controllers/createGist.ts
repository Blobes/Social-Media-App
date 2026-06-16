import { Response } from "express";
import {
  getClientIp,
  generateRandomIp,
  getLocationFromIp,
  enqueueModerationTask,
  IAuthRequest,
  IPostModData,
  finalizeGistCreation,
  FinalizePostReq,
  ModerationTaskMode,
} from "@repo/shared";
import { GistModel, IMedia, IPostStatus } from "@repo/database";
import { FUNSTAKES_REDIS_URL, s3Config } from "@/envVars";

export interface CreateRequest extends IAuthRequest {
  body: {
    caption?: string;
    media?: IMedia[];
    topics?: string[];
    hasSensitiveGraphic?: boolean;
    skipModeration?: boolean;
  };
}

export const createGist = async (req: CreateRequest, res: Response) => {
  const userId = req.user?.id;
  const {
    caption,
    media,
    topics,
    skipModeration = false,
    hasSensitiveGraphic = false,
  } = req.body;

  if (!userId) {
    res.status(400).json({
      status: "ERROR",
      payload: null,
      message: "Invalid User Session",
    });
    return;
  }

  const hasCaption = caption && caption.trim().length > 0;
  const hasMedia = media && Array.isArray(media) && media.length > 0;

  if (!hasCaption && !hasMedia) {
    res.status(400).json({
      status: "ERROR",
      message: "Gist must contain either text content or media.",
    });
    return;
  }

  const userIp = getClientIp(req);
  const geoData = await getLocationFromIp(generateRandomIp());
  const location = geoData
    ? {
        name: `${geoData.city}, ${geoData.state}`,
        type: "Point" as const,
        coordinates: [Number(geoData.longitude), Number(geoData.latitude)],
      }
    : undefined;

  try {
    const hasUserTopics = topics && topics.length > 0;

    // Determine the baseline status based on whether full safety screening is bypassed
    const initialStatus: IPostStatus = skipModeration
      ? "PUBLISHED"
      : "UNDER_REVIEW";

    const newGist = await GistModel.create({
      authorId: userId,
      status: initialStatus,
      location,
      latestCaption: { caption: caption?.trim() || "Processing..." },
      hasSensitiveGraphic,
    });

    // Path 1: Skip moderation entirely AND user provided their own structural topics
    if (skipModeration) {
      await finalizeGistCreation(
        {
          postId: newGist._id.toString(),
          userId: userId.toString(),
          postType: "GIST",
          caption,
          media: media || [],
          event: "POST_CREATION",
          modResult: {
            status: "PUBLISHED",
            hasSensitiveGraphic,
            ruleViolated: "",
            severity: "NONE",
            reason:
              "Moderation skipped by administrative directive bypass constraints.",
            extractedTopics: topics,
            needsReview: false,
          },
        } as FinalizePostReq,
        { s3Config, redisKey: FUNSTAKES_REDIS_URL },
      );

      res.status(201).json({
        status: "SUCCESS",
        payload: { gistId: newGist._id },
        message: "Gist created successfully via skip bypass pathing.",
      });
      return;
    }

    // Path 2: Enqueue worker tasks for asynchronous evaluation pipelines
    let modTaskMode: ModerationTaskMode;
    if (skipModeration) modTaskMode = "EXTRACT_KEYWORDS_ONLY";
    else
      modTaskMode = hasUserTopics
        ? "MODERATE_ONLY"
        : "MODERATE_AND_EXTRACT_KEYWORDS";

    const moderationData: IPostModData = {
      postId: newGist._id.toString(),
      postType: "GIST",
      userId: userId.toString(),
      caption,
      media,
      topics: topics || [],
      event: "POST_CREATION",
      moderationTaskMode: modTaskMode,
    };

    await enqueueModerationTask(
      FUNSTAKES_REDIS_URL,
      "moderate:post",
      moderationData,
    );

    const msg = skipModeration
      ? "Gist data initiated. Extracting contextual taxonomy descriptors."
      : "Gist is being processed.";

    res.status(202).json({
      status: "SUCCESS",
      payload: { gistId: newGist._id },
      message: msg,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "ERROR",
      message: error.message || "Failed to initiate gist",
    });
  }
};

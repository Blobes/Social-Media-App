import { Response } from "express";
import {
  IAuthRequest,
  getClientIp,
  generateRandomIp,
  getLocationFromIp,
  enqueueModerationTask,
  IPostModData,
  trimVideoAsset,
} from "@repo/shared";
import { GistModel, IMedia } from "@repo/database";
import { FUNSTAKES_REDIS_URL } from "@/envVars";

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
  const { caption, media, topics, skipModeration } = req.body;

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

  // 1. Immediate Geo-lookup (Fast)
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
    // 2. Create the "Shell" Gist so the user has an ID to track
    // We set status to UNDER_REVIEW so it doesn't show up in feeds yet
    const newGist = await GistModel.create({
      authorId: userId,
      status: "UNDER_REVIEW",
      location,
      latestCaption: { caption: caption?.trim() || "Processing..." },
    });

    // 3. Queue the "Heavy" work for the Worker using the Go protocol bridge
    // trimVideoAsset
    const moderationData: IPostModData = {
      postId: newGist._id.toString(),
      postType: "GIST",
      userId: userId.toString(),
      caption,
      media,
      topics,
      event: "POST_CREATION",
      skipModeration,
    };
    await enqueueModerationTask(
      FUNSTAKES_REDIS_URL,
      "moderate:post", // Maps exactly to mux.HandleFunc("moderate:post", ...) in main.go
      moderationData,
    );

    res.status(202).json({
      status: "SUCCESS",
      payload: { gistId: newGist._id },
      message: "Gist is being processed.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: "ERROR", message: "Failed to initiate gist" });
  }
};

import mongoose, { ClientSession } from "mongoose";
import { MediaModel } from "@/models/media";
import { IMediaInput } from "../types/types";

/**
 * Service to handle batch creation of media records linked to any source.
 * Following SRP (Single Responsibility Principle) and Polymorphic design.
 */
export const createMediaBatch = async (
  mediaItems: IMediaInput[],
  ownerId: string,
  session: ClientSession,
  context?: {
    sourceId: mongoose.Types.ObjectId;
    sourceType: "GIST" | "STAKE" | "USER" | "VERIFICATION";
  },
) => {
  // 1. Early return if no items to process
  if (!mediaItems || mediaItems.length === 0) return [];

  // 2. Map items to the new Schema field names (sourceId/sourceType)
  const mediaToCreate = mediaItems.map((item, index) => ({
    ...item,
    ownerId,
    // Spread context if provided, otherwise sourceId/Type remain undefined (optional)
    ...(context && {
      sourceId: context.sourceId,
      sourceType: context.sourceType,
    }),
    order: index,
    status: "READY", // Assuming client-side upload is successful
  }));

  const savedMedia = await MediaModel.insertMany(mediaToCreate, { session });

  // Return IDs so the parent entity can store them in its mediaIds array
  return savedMedia.map((m) => m._id as mongoose.Types.ObjectId);
};

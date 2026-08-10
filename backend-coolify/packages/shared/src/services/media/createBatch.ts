import { ClientSession, Types } from "mongoose";
import { MediaModel, IMedia, IMediaDocument } from "@repo/database";

/**
 * Service to handle batch creation of media records linked to any source with optional customizations.
 */
export const createMediaBatch = async (
  mediaItems: IMedia[],
  ownerId: string,
  session: ClientSession,
  context?: {
    sourceId: Types.ObjectId;
    sourceType: "GIST" | "STAKE" | "USER" | "VERIFICATION";
  },
): Promise<Types.ObjectId[]> => {
  if (!mediaItems || mediaItems.length === 0) return [];

  const mediaToCreate: Partial<IMediaDocument>[] = mediaItems.map(
    (item, index) => ({
      ...item,
      ownerId: new Types.ObjectId(ownerId),
      customizations: item.customizations || {
        textsOnMedia: [],
        filter: "ORIGINAL",
        stickersOnMedia: [],
      },
      ...(context && {
        sourceId: context.sourceId,
        sourceType: context.sourceType,
      }),
      order: index,
      status: "READY",
    }),
  );

  const savedMedia = await MediaModel.insertMany(mediaToCreate, { session });

  return savedMedia.map((m) => m._id as Types.ObjectId);
};

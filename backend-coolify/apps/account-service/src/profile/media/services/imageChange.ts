import { UserModel, IMedia } from "@repo/database";
import {
  createMediaBatch,
  userSensitiveFields,
  invalidateCache,
  CACHE_KEYS,
  TransInfo,
  MESSAGES_REGISTRY,
} from "@repo/shared";
import mongoose from "mongoose";

export type UserImageType = "PROFILE" | "COVER";

interface IChangeUserImageInput {
  userId: string;
  imageType: UserImageType;
  url: string;
  fileKey: string;
  mimeType?: string;
}

interface IChangeUserImageResult {
  status: "SUCCESS" | "NOT_FOUND";
  transInfo?: TransInfo;
  payload?: {
    user: any;
    mediaId: mongoose.Types.ObjectId;
  };
}

export type RemoveImageType = "PROFILE" | "COVER";

/**
 * Handles transactional execution for creating user asset records and updating profile fields.
 */
export const executeUserImageChange = async (
  input: IChangeUserImageInput,
): Promise<IChangeUserImageResult> => {
  const { userId, imageType, url, fileKey, mimeType } = input;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const mediaInput: IMedia[] = [
      {
        url,
        fileKey,
        type: "IMAGE",
        mimeType: mimeType || "image/jpeg",
        storageProvider: "S3",
      },
    ];

    // Persist structural media tracking item
    const savedMediaIds = await createMediaBatch(mediaInput, userId, session, {
      sourceId: new mongoose.Types.ObjectId(userId),
      sourceType: "USER",
    });

    const newMediaId = savedMediaIds[0];

    // Determine target property to link created asset ID
    const updateField =
      imageType === "PROFILE"
        ? { profileImage: newMediaId }
        : { coverImage: newMediaId };

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateField },
      { new: true, session },
    ).populate("profileImage coverImage");

    if (!updatedUser) {
      throw new Error("USER NOT FOUND");
    }

    await session.commitTransaction();

    // Invalidate local profile lookup items only after commit blocks succeed
    await invalidateCache(CACHE_KEYS.USER_PROFILE(userId));

    // Clear protected credential information properties
    const safePayload = updatedUser.toObject();
    userSensitiveFields().forEach((field) => {
      delete (safePayload as any)[field];
    });

    return {
      status: "SUCCESS",
      transInfo: MESSAGES_REGISTRY.PROFILE.IMAGE_UPDATE_SUCCESS(
        imageType === "PROFILE" ? "Profile" : "Cover",
      ),
      payload: {
        user: safePayload,
        mediaId: newMediaId,
      },
    };
  } catch (error: any) {
    await session.abortTransaction();
    if (error.message === "USER NOT FOUND") {
      return {
        status: "NOT_FOUND",
        transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
      };
    }
    throw error;
  } finally {
    session.endSession();
  }
};

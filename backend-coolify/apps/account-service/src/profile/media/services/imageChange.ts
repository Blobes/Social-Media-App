import mongoose from "mongoose";
import { IMedia, IUserDocument } from "@repo/database";
import {
  createMediaBatch,
  fetchSingleUser,
  TransInfo,
  MESSAGES_REGISTRY,
} from "@repo/shared";

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
    user: unknown;
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
    const user = await fetchSingleUser({
      identifier: userId,
      session,
      flags: { lean: false },
    });

    if (!user) {
      throw new Error("USER NOT FOUND");
    }

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
    if (imageType === "PROFILE") {
      user.profileImage = newMediaId;
    } else {
      user.coverImage = newMediaId;
    }

    await user.save({ session });
    await session.commitTransaction();

    // Fetch lean sanitized profile snapshot directly through shared helper with populated media
    const updatedLeanUser = await fetchSingleUser<IUserDocument>({
      identifier: userId,
      populate: ["profileImage", "coverImage"],
      flags: { lean: true, includeSensitiveFields: false },
    });

    return {
      status: "SUCCESS",
      transInfo: MESSAGES_REGISTRY.PROFILE.IMAGE_UPDATE_SUCCESS(
        imageType === "PROFILE" ? "Profile" : "Cover",
      ),
      payload: {
        user: updatedLeanUser,
        mediaId: newMediaId,
      },
    };
  } catch (error: unknown) {
    await session.abortTransaction();
    if (error instanceof Error && error.message === "USER NOT FOUND") {
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

import { UserModel } from "@repo/database";
import {
  IAuthRequest,
  createMediaBatch,
  IMediaInput,
  userSensitiveFields,
  invalidateCache,
} from "@repo/shared";
import { Response } from "express";
import mongoose from "mongoose";

interface ImageRequest {
  imageType: "PROFILE" | "COVER";
  url: string;
  fileKey: string;
  mimeType?: string;
}

export const changeUserImage = async (
  req: IAuthRequest,
  res: Response,
): Promise<void> => {
  const { imageType, url, fileKey, mimeType } = req.body as ImageRequest;
  const userId = req.user?.id;

  // Fail fast if the user isn't authenticated
  if (!userId) {
    res.status(401).json({
      status: "ERROR",
      message: "Unauthorized access detected.",
      payload: null,
    });
    return;
  }

  // Validate the payload before starting heavy DB operations
  if (!url || !fileKey || !imageType) {
    res.status(400).json({
      status: "ERROR",
      message: "url, fileKey, and imageType (PROFILE/COVER) are required.",
      payload: null,
    });
    return;
  }

  // Start a transaction to ensure media creation and user update are atomic
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const mediaInput: IMediaInput[] = [
      {
        url,
        fileKey,
        type: "IMAGE",
        mimeType: mimeType || "image/jpeg",
        storageProvider: "S3",
      },
    ];

    // Call the batch service to handle the media entry
    const savedMediaIds = await createMediaBatch(mediaInput, userId, session, {
      sourceId: new mongoose.Types.ObjectId(userId),
      sourceType: "USER",
    });

    const newMediaId = savedMediaIds[0];

    // Dynamically select the field based on the imageType provided
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
      throw new Error("User account not found or deactivated.");
    }

    // Commit the transaction to finalize DB changes
    await session.commitTransaction();

    // Clear the cache ONLY after a successful commit
    // This prevents stale data from being served during the next profile fetch
    await invalidateCache(`user:profile:${userId}`);

    // Sanitize the user object to remove passwords/tokens before responding
    const safePayload = updatedUser.toObject();
    userSensitiveFields().forEach((field) => {
      delete (safePayload as any)[field];
    });

    res.status(200).json({
      status: "SUCCESS",
      message: `${imageType === "PROFILE" ? "Profile" : "Cover"} image updated successfully`,
      payload: {
        user: safePayload,
        mediaId: newMediaId,
      },
    });
  } catch (error: any) {
    // Rollback all changes if any part of the process fails
    await session.abortTransaction();
    console.error(`Update ${imageType} Error:`, error);
    res.status(500).json({
      status: "ERROR",
      message: error.message || "Failed to update profile images.",
      payload: null,
    });
  } finally {
    // Ensure the session is closed regardless of the outcome
    session.endSession();
  }
};

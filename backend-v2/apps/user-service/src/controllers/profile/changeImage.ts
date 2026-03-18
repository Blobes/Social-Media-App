import { UserModel } from "@repo/database";
import {
  IAuthRequest,
  createMediaBatch,
  IMediaInput,
  userSensitiveFields,
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

  // Guard Clauses (Fail Fast)
  if (!userId) {
    res
      .status(401)
      .json({ status: "ERROR", message: "Unauthorized", payload: null });
    return;
  }

  if (!url || !fileKey || !imageType) {
    res.status(400).json({
      status: "ERROR",
      message: "url, fileKey, and imageType (PROFILE/COVER) are required.",
      payload: null,
    });
    return;
  }

  // Start a Transaction to ensure atomicity
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Prepare the media input for the batch service
    const mediaInput: IMediaInput[] = [
      {
        url,
        fileKey,
        type: "IMAGE",
        mimeType: mimeType || "image/jpeg",
        storageProvider: "S3",
      },
    ];

    // Use the reusable batch service
    const savedMediaIds = await createMediaBatch(mediaInput, userId, session, {
      sourceId: new mongoose.Types.ObjectId(userId),
      sourceType: "USER",
    });

    const newMediaId = savedMediaIds[0];

    // Determine which field to update on the User model
    const updateField =
      imageType === "PROFILE"
        ? { profileImage: newMediaId }
        : { coverImage: newMediaId };

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateField },
      { new: true, session },
    ).populate("profileImage coverImage"); // Populate to return the full media object to frontend

    if (!updatedUser) {
      throw new Error("User account not found or deactivated.");
    }

    // Commit the changes to both collections
    await session.commitTransaction();

    // Sanitize the response
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
    // Rollback both the Media creation and User update if either fails
    await session.abortTransaction();
    console.error(`Update ${imageType} Error:`, error);
    res.status(500).json({
      status: "ERROR",
      message: error.message || "Failed to update profile images.",
      payload: null,
    });
  } finally {
    session.endSession();
  }
};

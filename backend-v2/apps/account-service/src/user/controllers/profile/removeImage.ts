import { UserModel } from "@repo/database";
import {
  IAuthRequest,
  softDeleteMedia,
  userSensitiveFields,
  invalidateCache,
  CACHE_KEYS,
} from "@repo/shared";
import { Response } from "express";

interface RemoveRequest extends IAuthRequest {
  body: {
    imageType: "PROFILE" | "COVER";
  };
}

export const removeUserImage = async (
  req: RemoveRequest,
  res: Response,
): Promise<any> => {
  const authUserId = req.user?.id;
  const { imageType } = req.body;

  // Fail fast if the user is not authenticated
  if (!authUserId) {
    return res.status(401).json({
      status: "ERROR",
      message: "Unauthorized access",
      payload: null,
    });
  }

  // Validate the image type before proceeding
  if (imageType !== "PROFILE" && imageType !== "COVER") {
    return res.status(400).json({
      status: "ERROR",
      message: "Invalid image type. Must be 'PROFILE' or 'COVER'.",
      payload: null,
    });
  }

  const fieldToUpdate = imageType === "PROFILE" ? "profileImage" : "coverImage";

  try {
    // Execute soft delete to handle the database reference update
    const updatedUser = await softDeleteMedia({
      model: UserModel as any,
      id: authUserId,
      field: fieldToUpdate,
      populateFields: ["profileImage", "coverImage"],
    });

    if (!updatedUser) {
      return res.status(404).json({
        status: "ERROR",
        message: "User not found or deactivated",
        payload: null,
      });
    }

    // Invalidate the profile cache to reflect the removal immediately
    await invalidateCache(CACHE_KEYS.USER_PROFILE(authUserId));

    // Sanitize the response payload
    const safePayload = updatedUser.toObject();
    userSensitiveFields().forEach((field) => {
      delete (safePayload as any)[field];
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: `${imageType === "PROFILE" ? "Profile" : "Cover"} image removed from view`,
      payload: safePayload,
    });
  } catch (error: any) {
    console.error("Soft Delete Media Error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: error.message || "Failed to remove image reference",
      payload: null,
    });
  }
};

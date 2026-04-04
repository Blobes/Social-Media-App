import { UserModel } from "@repo/database";
import {
  IAuthRequest,
  userSensitiveFields,
  invalidateCache,
  CACHE_KEYS,
} from "@repo/shared";
import { Response } from "express";

interface DemoRequest extends IAuthRequest {
  body: {
    gender?: string;
    dateOfBirth?: string;
    location?: string;
    occupation?: string;
    relationship?: string;
  };
}

export const updateDemoInfo = async (
  req: DemoRequest,
  res: Response,
): Promise<any> => {
  // Use the ID from the token for security
  const authUserId = req.user?.id;

  if (!authUserId) {
    return res.status(401).json({
      message: "Unauthorized access",
      status: "ERROR",
      payload: null,
    });
  }

  // Extract only the allowed demographic fields
  const { gender, dateOfBirth, location, occupation, relationship } = req.body;

  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      authUserId,
      {
        $set: {
          gender,
          dateOfBirth,
          location,
          occupation,
          relationship,
        },
      },
      { new: true, runValidators: true },
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: "User account not found or deactivated",
        status: "ERROR",
        payload: null,
      });
    }

    // Invalidate the profile cache after successful database update
    await invalidateCache(CACHE_KEYS.USER_PROFILE(authUserId));

    const safePayload = updatedUser.toObject();

    // Remove strictly internal/security fields using the helper
    userSensitiveFields().forEach((field) => {
      delete (safePayload as any)[field];
    });

    return res.status(200).json({
      message: "Demographic information updated successfully",
      status: "SUCCESS",
      payload: safePayload,
    });
  } catch (error: any) {
    console.error("Update Demo Error:", error);
    return res.status(500).json({
      message: error.message || "Failed to update demographic info",
      status: "ERROR",
      payload: null,
    });
  }
};

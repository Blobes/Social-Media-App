import mongoose from "mongoose";
import { Response } from "express";
import {
  IAuthRequest,
  getUserAggregation,
  userPrivateFields,
  userSensitiveFields,
  getOrSetCache,
  decorateUserSocial, // Our new centralized decorator
} from "@repo/shared";
import { UserModel } from "@repo/database";

const getUserProfile = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const targetUserId = req.params.id as string;
  const authUserId = req.user?.id;

  // Validate ID format early to save resources
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({
      message: "Invalid user ID format",
      status: "ERROR",
      payload: null,
    });
  }

  try {
    const isOwner = authUserId === targetUserId;
    const cacheKey = `user:profile:${targetUserId}`;

    // 1. FETCH NEUTRAL PROFILE
    // This pulls from Redis (shared by all visitors) or runs the neutral aggregation
    const baseProfile = await getOrSetCache(
      cacheKey,
      async () => {
        const users = await UserModel.aggregate([
          {
            $match: { _id: new mongoose.Types.ObjectId(String(targetUserId)) },
          },
          ...getUserAggregation(), // Standardized neutral aggregation
        ]);
        return users && users.length > 0 ? users[0] : null;
      },
      1800, // Cache for 30 minutes
    );

    if (!baseProfile) {
      return res.status(404).json({
        message: "User not found",
        status: "ERROR",
        payload: null,
      });
    }

    // 2. ACCOUNT DEACTIVATED CHECK
    // Fail fast if the account is deactivated to prevent unnecessary decoration
    if (baseProfile.isDeactivated) {
      return res.status(200).json({
        message: "This account has been deactivated",
        status: "DEACTIVATED",
        payload: {
          _id: baseProfile._id,
          username: baseProfile.username,
          profileImage: baseProfile.profileImage,
          firstName: baseProfile.firstName,
          lastName: baseProfile.lastName,
          isDeactivated: true,
          isOwner,
        },
      });
    }

    // 3. DECORATE SOCIAL CONTEXT
    // Uses the high-performance utility to "paint" isFollowing/followsMe
    // Note: If authUserId is null, the decorator returns the profile as-is
    const userProfile = await decorateUserSocial(
      { ...baseProfile, isOwner },
      authUserId,
    );

    // 4. PRIVACY & SECURITY CLEANUP
    // Strip passwords/internal IDs (Sensitive) and non-public info (Private)
    const sensitiveFields = userSensitiveFields();
    sensitiveFields.forEach((field) => {
      delete userProfile[field];
    });

    if (!isOwner) {
      const privateFields = userPrivateFields();
      privateFields.forEach((field) => {
        delete userProfile[field];
      });
    }

    return res.status(200).json({
      message: "User fetched successfully",
      status: "SUCCESS",
      payload: userProfile,
    });
  } catch (error: any) {
    console.error("Get User Error:", error);
    return res.status(500).json({
      message: error.message || "Failed to get user due to server error",
      status: "ERROR",
      payload: null,
    });
  }
};

export default getUserProfile;

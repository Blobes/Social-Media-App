import { UserModel } from "@repo/database";
import {
  CACHE_KEYS,
  IAuthRequest,
  invalidateCache,
  cleanDeviceSessions,
  clearAuthTokens,
} from "@repo/shared";
import bcrypt from "bcrypt";
import { Response } from "express";

interface PassWordRequest extends IAuthRequest {
  body: {
    currentPassword: string;
    newPassword: string;
  };
}

export const changePassword = async (
  req: PassWordRequest,
  res: Response,
): Promise<any> => {
  const userId = req.user?.id;
  const jwtDeviceId = req.user?.deviceId; // Extracted from auth middleware
  const { currentPassword, newPassword } = req.body;

  if (!userId || !jwtDeviceId) {
    return res.status(401).json({
      message: "Unauthorized access",
      status: "ERROR",
      payload: null,
    });
  }

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      message: "Current password and new password are required",
      status: "ERROR",
      payload: null,
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      message: "New password must be at least 6 characters long",
      status: "ERROR",
      payload: null,
    });
  }

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        status: "ERROR",
        payload: null,
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "The current password you entered is incorrect",
        status: "ERROR",
        payload: null,
      });
    }

    // Prevent reuse of existing password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        message: "New password cannot be the same as your current password",
        status: "ERROR",
        payload: null,
      });
    }

    // Hash and update
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // --- HARDWARE-BASED SESSION CLEANUP ---
    // We clear all sessions except for the primary device.
    const wasSessionPreserved = await cleanDeviceSessions(userId, undefined, {
      clearAll: true,
      preservePrimary: true,
      primaryDeviceId: user.primaryDeviceId?.toString(),
    });

    await invalidateCache(CACHE_KEYS.USER_PROFILE(userId));

    // Determine if the current user was on a secondary device and got logged out
    const isCurrentDevicePrimary =
      jwtDeviceId === user.primaryDeviceId?.toString();
    const shouldLogout = !isCurrentDevicePrimary || !wasSessionPreserved;

    if (shouldLogout) {
      clearAuthTokens(res);
      return res.status(200).json({
        message:
          "Password changed. Secondary device sessions ended for security.",
        status: "SUCCESS",
        payload: { loggedOut: true },
      });
    }

    return res.status(200).json({
      message:
        "Password changed successfully. All other devices have been logged out.",
      status: "SUCCESS",
      payload: { loggedOut: false },
    });
  } catch (error: any) {
    console.error("Change Password Error:", error);
    return res.status(500).json({
      message: error.message || "Failed to change password due to server error",
      status: "ERROR",
      payload: null,
    });
  }
};

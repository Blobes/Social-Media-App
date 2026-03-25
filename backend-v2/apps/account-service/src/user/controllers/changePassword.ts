import { UserModel } from "@repo/database";
import {
  IAuthRequest,
  invalidateCache,
  manageUserSessions,
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
  const currentSessionId = req.user?.sessionId;
  const { currentPassword, newPassword } = req.body;

  if (!userId || !currentSessionId) {
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

    // --- REUSABLE SESSION CLEANUP ---
    // This utility handles the scanning and conditional deletion
    const wasSessionPreserved = await manageUserSessions({
      userId,
      currentSessionId,
      keepCurrentIfPrimary: true,
      primarySessionId: user.primarySessionId,
    });

    // Surgical cache invalidation for the user's profile
    await invalidateCache(`user:profile:${userId}`);

    // If session wasn't preserved (not primary), nuke cookies
    if (!wasSessionPreserved) {
      res.clearCookie("access_token", { path: "/" });
      res.clearCookie("refresh_token", { path: "/" });

      return res.status(200).json({
        message:
          "Password changed. Since this is not your primary device, you have been logged out for security.",
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

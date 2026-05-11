import { UserModel } from "@repo/database";
import {
  CACHE_KEYS,
  hashCode,
  invalidatePattern,
  IAuthRequest,
  cleanDeviceSessions,
  clearAuthTokens,
} from "@repo/shared";
import { Response } from "express";

/**
 * Finalizes a pending email change and secures the account by rotating sessions.
 */
export const verifyEmailUpdate = async (
  req: IAuthRequest,
  res: Response,
): Promise<void> => {
  const { code } = req.body as { code?: string };
  const userId = req.user?.id;
  const currentDeviceId = req.user?.deviceId;

  if (!code) {
    res.status(400).json({
      status: "ERROR",
      message: "Verification code is required.",
      payload: null,
    });
    return;
  }

  try {
    const user = await UserModel.findById(userId);

    if (!user) {
      res.status(404).json({
        status: "ERROR",
        message: "User not found.",
        payload: null,
      });
      return;
    }

    if (!user.pendingEmail) {
      res.status(400).json({
        status: "ERROR",
        message: "No pending email change found.",
        payload: null,
      });
      return;
    }

    if (!user.verificationCode || !user.verificationExpiry) {
      res.status(400).json({
        status: "ERROR",
        message: "No active verification process found.",
        payload: null,
      });
      return;
    }

    if (Date.now() > user.verificationExpiry.getTime()) {
      res.status(400).json({
        status: "ERROR",
        message: "Verification code has expired.",
        payload: null,
      });
      return;
    }

    if (hashCode(code) !== user.verificationCode) {
      res.status(400).json({
        status: "ERROR",
        message: "Invalid verification code.",
        payload: null,
      });
      return;
    }

    // Update identity and clear verification state
    user.email = user.pendingEmail;
    user.pendingEmail = null;
    user.isEmailVerified = true;
    user.lastEmailChangeAt = new Date();
    user.lastEmailCodeSentAt = null;
    user.verificationCode = null;
    user.verificationExpiry = null;

    await user.save();

    // Security: Preserve primary device but clear others after sensitive identity change
    await cleanDeviceSessions(String(userId), undefined, {
      clearAll: true,
      preservePrimary: true,
      primaryDeviceId: user.primaryDeviceId?.toString(),
    });

    const isCurrentDevicePrimary =
      currentDeviceId === user.primaryDeviceId?.toString();

    // If user updated email from a secondary device, nuke local tokens for re-auth
    if (!isCurrentDevicePrimary) {
      clearAuthTokens(res);
    }

    await invalidatePattern(CACHE_KEYS.WILDCARD_USER_ALL(String(user._id)));

    res.status(200).json({
      status: "SUCCESS",
      message:
        "Email updated successfully. Other devices have been logged out.",
      payload: { loggedOut: !isCurrentDevicePrimary },
    });
  } catch (error) {
    console.error("[verifyEmailUpdate] Error:", error);
    res.status(500).json({
      status: "ERROR",
      message:
        error instanceof Error ? error.message : "Internal server error.",
      payload: null,
    });
  }
};

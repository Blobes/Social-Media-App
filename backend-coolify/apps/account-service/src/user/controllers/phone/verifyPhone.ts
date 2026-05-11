import { UserModel } from "@repo/database";
import {
  CACHE_KEYS,
  IAuthRequest,
  hashCode,
  invalidateCache,
  cleanDeviceSessions,
  clearAuthTokens,
} from "@repo/shared";
import { Response } from "express";

/**
 * Finalizes phone number update and rotates sessions for security.
 */
export const verifyPhoneUpdate = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const { code } = req.body;
  const userId = req.user?.id;
  const currentDeviceId = req.user?.deviceId;

  try {
    const user = await UserModel.findById(userId);

    if (!user || !user.pendingPhoneNumber) {
      return res.status(400).json({
        status: "ERROR",
        message: "No pending phone change request found.",
        payload: null,
      });
    }

    const isCodeValid = hashCode(code) === user.verificationCode;
    const isExpired = user.verificationExpiry
      ? new Date() > user.verificationExpiry
      : true;

    if (!isCodeValid || isExpired) {
      return res.status(400).json({
        status: "ERROR",
        message: isExpired
          ? "Verification code has expired."
          : "Invalid verification code.",
        payload: null,
      });
    }

    user.phoneNumber = user.pendingPhoneNumber;
    user.pendingPhoneNumber = null;
    user.verificationCode = null;
    user.verificationExpiry = null;
    user.lastPhoneChangeAt = new Date();

    await user.save();

    // Security: Preserve primary device but clear others after sensitive identity change
    await cleanDeviceSessions(String(userId), undefined, {
      clearAll: true,
      preservePrimary: true,
      primaryDeviceId: user.primaryDeviceId?.toString(),
    });

    const isCurrentDevicePrimary =
      currentDeviceId === user.primaryDeviceId?.toString();

    // Logout secondary devices to force re-authentication with new identity state
    if (!isCurrentDevicePrimary) {
      clearAuthTokens(res);
    }

    await invalidateCache(CACHE_KEYS.USER_PROFILE(userId as string));

    return res.status(200).json({
      status: "SUCCESS",
      message: "Phone number verified. Other sessions have been terminated.",
      payload: {
        phoneNumber: user.phoneNumber,
        loggedOut: !isCurrentDevicePrimary,
      },
    });
  } catch (error: any) {
    console.error("Verify Phone Error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "An error occurred during verification.",
      payload: null,
    });
  }
};

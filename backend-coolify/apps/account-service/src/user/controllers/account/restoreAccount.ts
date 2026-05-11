import { UserModel } from "@repo/database";
import {
  IAuthRequest,
  userSensitiveFields,
  CACHE_KEYS,
  invalidateCache,
  upsertDevice,
  getOrSetDeviceToken,
} from "@repo/shared";
import { Response } from "express";

/**
 * Restores account status and re-establishes hardware trust.
 */
export const restoreAccount = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const authUserId = req.user?.id;
  const deviceToken = getOrSetDeviceToken(req, res);

  try {
    const user = await UserModel.findOne({
      _id: authUserId,
      isDeactivated: true,
    }).setOptions({ skipFilter: true });

    if (!user) {
      return res.status(404).json({
        status: "ERROR",
        message: "No deactivated account found or grace period has expired.",
        payload: null,
      });
    }

    // Restore identity status
    user.isDeactivated = false;
    user.deactivatedAt = null as any;
    user.accountStatus = "ACTIVE";
    await user.save();

    // Re-register the current hardware as an active/primary device
    if (deviceToken) {
      await upsertDevice(user, deviceToken, req);
    }

    await invalidateCache(CACHE_KEYS.USER_PROFILE(authUserId as string));

    const safeData = user.toObject();
    userSensitiveFields().forEach((field) => {
      delete (safeData as any)[field];
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Welcome back! Your account has been fully restored.",
      payload: safeData,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "ERROR",
      message: error.message || "Failed to restore account.",
      payload: null,
    });
  }
};

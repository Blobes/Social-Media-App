import { UserModel, DeviceModel } from "@repo/database";
import {
  CACHE_KEYS,
  clearAuthTokens,
  IAuthRequest,
  invalidatePattern,
  cleanDeviceSessions,
} from "@repo/shared";
import { Response } from "express";

/**
 * Handles account deactivation and clears all hardware-linked sessions and primary status.
 */
export const deactivateAccount = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const { targetId } = req.body as { targetId?: string };
  const authUserId = req.user?.id;
  const userRole = req.user?.role;

  if (!authUserId) {
    return res.status(401).json({
      status: "ERROR",
      message: "Unauthorized",
      payload: null,
    });
  }

  try {
    const isDeactivatingSelf = !targetId || targetId === authUserId;
    const finalIdToProcess = isDeactivatingSelf
      ? authUserId
      : (targetId as string);

    if (!isDeactivatingSelf && userRole !== "ADMIN") {
      return res.status(403).json({
        status: "ERROR",
        message: "You don't have permission to perform this action",
        payload: null,
      });
    }

    const userToExclude = await UserModel.findById(finalIdToProcess);

    if (!userToExclude) {
      return res.status(404).json({
        status: "ERROR",
        message: "User not found",
        payload: null,
      });
    }

    if (userToExclude.isDeactivated) {
      return res.status(400).json({
        status: "ERROR",
        message: "Account is already deactivated",
        payload: null,
      });
    }

    // 1. Update User Record
    await UserModel.findByIdAndUpdate(
      finalIdToProcess,
      {
        $set: {
          isDeactivated: true,
          deactivatedAt: new Date(),
          accountStatus: "DEACTIVATED",
          verificationCode: null,
          pendingEmail: null,
          primaryDeviceId: null, // Clear primary device anchor
        },
      },
      { new: true },
    );

    // 2. Clear Hardware Registry Status
    await DeviceModel.updateMany(
      { userId: finalIdToProcess },
      { $set: { isPrimary: false, isStale: true } },
    );

    // 3. Wipe sessions and cache
    await Promise.all([
      cleanDeviceSessions(finalIdToProcess, undefined, { clearAll: true }),
      invalidatePattern(CACHE_KEYS.WILDCARD_USER_ALL(finalIdToProcess)),
      invalidatePattern(CACHE_KEYS.WILDCARD_USER_SESSIONS(finalIdToProcess)),
    ]);

    if (isDeactivatingSelf) {
      clearAuthTokens(res);
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: isDeactivatingSelf
        ? "Your account has been deactivated."
        : "User account deactivated by administrator.",
      payload: null,
    });
  } catch (error: any) {
    console.error("Soft Delete Error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: error.message || "Failed to deactivate account.",
      payload: null,
    });
  }
};

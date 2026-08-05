import { DeviceModel, UserModel } from "@repo/database";
import { clearAuthCookies } from "@repo/security";
import {
  cleanDeviceSessions,
  ensurePrimaryDevice,
  fetchSingleUser,
  fetchUserData,
  forwardError,
  IAuthRequest,
  MESSAGES_REGISTRY,
} from "@repo/shared";
import { NextFunction, Response } from "express";

/**
 * Controller update: Wipes Redis sessions when a device is removed.
 */
export const removeDevice = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const userId = req.user?.id!;
  const currentDeviceId = req.user?.deviceId;
  const { id } = req.params;

  try {
    const device = await DeviceModel.findOne({ _id: id, userId });
    if (!device) {
      return res.status(404).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.AUTH.DEACTIVATED_NOT_FOUND,
      });
    }

    // Wipe all sessions associated with this hardware ID in Redis
    await cleanDeviceSessions(userId, id);

    const wasPrimary = device.isPrimary;
    const isCurrentDevice = id === currentDeviceId;

    await device.deleteOne();

    if (wasPrimary) {
      const user = await fetchSingleUser({
        identifier: userId,
        flags: { lean: false },
      });

      if (user) {
        user.primaryDeviceId = null;
        await ensurePrimaryDevice(user, currentDeviceId?.toString());
      }
    }

    if (isCurrentDevice) {
      clearAuthCookies(res);
      return res.status(200).json({
        status: "SUCCESS",
        ...MESSAGES_REGISTRY.AUTH.DEVICE_SESSION_TERMINATED,
        payload: { logout: true },
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...MESSAGES_REGISTRY.AUTH.DEVICE_REMOVED,
    });
  } catch (error: any) {
    console.error("Remove Device Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};

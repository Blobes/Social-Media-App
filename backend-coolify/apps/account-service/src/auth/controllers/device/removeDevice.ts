import { DeviceModel, UserModel } from "@repo/database";
import {
  cleanDeviceSessions,
  clearAuthTokens,
  ensurePrimaryDevice,
  IAuthRequest,
} from "@repo/shared";
import { Response } from "express";

/**
 * Controller update: Wipes Redis sessions when a device is removed.
 */
export const removeDevice = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const userId = req.user?.id!;
  const currentDeviceId = req.user?.deviceId;
  const { id } = req.params;

  try {
    const device = await DeviceModel.findOne({ _id: id, userId });
    if (!device)
      return res.status(404).json({ status: "ERROR", message: "Not found" });

    // Wipe all sessions associated with this hardware ID in Redis
    await cleanDeviceSessions(userId, id);

    const wasPrimary = device.isPrimary;
    const isCurrentDevice = id === currentDeviceId;

    await device.deleteOne();

    if (wasPrimary) {
      const user = await UserModel.findById(userId);
      if (user) {
        user.primaryDeviceId = null;
        await ensurePrimaryDevice(user, currentDeviceId?.toString());
      }
    }

    if (isCurrentDevice) {
      clearAuthTokens(res);
      return res.status(200).json({
        status: "SUCCESS",
        message: "Device removed and all related sessions terminated.",
        payload: { logout: true },
      });
    }

    return res
      .status(200)
      .json({ status: "SUCCESS", message: "Device removed." });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "ERROR", message: "Failed to remove device." });
  }
};

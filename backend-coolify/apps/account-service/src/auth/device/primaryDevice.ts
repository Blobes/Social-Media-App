import { DeviceModel, UserModel } from "@repo/database";
import {
  checkUserExists,
  forwardError,
  IAuthRequest,
  MESSAGES_REGISTRY,
} from "@repo/shared";
import { NextFunction, Response } from "express";

/**
 * Manually promotes a specific device to the primary anchor for the account.
 */
export const setPrimaryDevice = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  const userId = req.user?.id;
  const { id } = req.params;

  try {
    // Perform lightweight existence check
    const userExists = await checkUserExists({
      identifier: userId,
    });

    if (!userExists) {
      return res.status(404).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
        payload: null,
      });
    }

    const targetDevice = await DeviceModel.findOne({ _id: id, userId });

    if (!targetDevice) {
      return res.status(404).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.AUTH.PRIMARY_DEVICE_NOT_FOUND,
        payload: null,
      });
    }

    // Demote existing primary in the registry
    await DeviceModel.updateMany(
      { userId, isPrimary: true },
      { $set: { isPrimary: false } },
    );

    // Promote new primary in the registry
    targetDevice.isPrimary = true;
    targetDevice.isStale = false; // Reset stale status if it was flagged
    await targetDevice.save();

    // Update anchor link on user document
    await UserModel.findByIdAndUpdate(userId, {
      $set: { primaryDeviceId: targetDevice._id },
    });

    return res.status(200).json({
      status: "SUCCESS",
      ...MESSAGES_REGISTRY.AUTH.PRIMARY_DEVICE_UPDATED,
      payload: targetDevice,
    });
  } catch (error: unknown) {
    console.error("Set Primary Device Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};

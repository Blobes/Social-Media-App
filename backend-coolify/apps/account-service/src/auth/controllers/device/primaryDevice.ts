import { DeviceModel, UserModel } from "@repo/database";
import { CACHE_KEYS, IAuthRequest } from "@repo/shared";
import { Response } from "express";

/**
 * Manually promotes a specific device to the primary anchor for the account.
 */
export const setPrimaryDevice = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const userId = req.user?.id;
  const { id } = req.params;

  try {
    const targetDevice = await DeviceModel.findOne({ _id: id, userId });

    if (!targetDevice) {
      return res.status(404).json({
        status: "ERROR",
        message: "Device not found.",
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

    // Update the anchor link on the user document
    await UserModel.findByIdAndUpdate(userId, {
      $set: { primaryDeviceId: targetDevice._id },
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Primary device updated successfully.",
      payload: targetDevice,
    });
  } catch (error) {
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to update primary device.",
      payload: null,
    });
  }
};

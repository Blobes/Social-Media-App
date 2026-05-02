import { DeviceModel } from "@repo/database";
import { IAuthRequest } from "@repo/shared";
import { Response } from "express";

/**
 * Fetches all hardware devices associated with the authenticated user.
 */
export const getDevices = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const userId = req.user?.id;

  try {
    const devices = await DeviceModel.find({ userId })
      .sort({ lastSeenAt: -1 })
      .lean();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Devices retrieved.",
      payload: devices,
    });
  } catch (error) {
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch devices.",
      payload: null,
    });
  }
};

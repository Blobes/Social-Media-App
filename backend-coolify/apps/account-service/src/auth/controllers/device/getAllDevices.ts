import { DeviceModel } from "@repo/database";
import { forwardError, IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import { NextFunction, Response } from "express";

/**
 * Fetches all hardware devices associated with the authenticated user.
 */
export const getDevices = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const userId = req.user?.id;

  try {
    const devices = await DeviceModel.find({ userId })
      .sort({ lastSeenAt: -1 })
      .lean();

    return res.status(200).json({
      status: "SUCCESS",
      ...MESSAGES_REGISTRY.AUTH.DEVICES_RETRIEVED,
      payload: devices,
    });
  } catch (error: any) {
    console.error("Get Device Error:", error);
    return forwardError(
      next,
      error.message
        ? MESSAGES_REGISTRY.AUTH.SERVER_THROWN_ERROR(error.message)
        : MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};

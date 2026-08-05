import { DeviceModel } from "@repo/database";
import {
  CACHE_EXPIRY,
  CACHE_KEYS,
  forwardError,
  getOrSetCache,
  IAuthRequest,
  MESSAGES_REGISTRY,
} from "@repo/shared";
import { NextFunction, Response } from "express";

/**
 * Fetches all hardware devices associated with the authenticated user with read-aside caching.
 */
export const getDevices = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
    return;
  }

  try {
    const cacheKey = CACHE_KEYS.WILDCARD_DEVICES(userId);

    const devices = await getOrSetCache(
      cacheKey,
      async () => {
        return await DeviceModel.find({ userId })
          .sort({ lastSeenAt: -1 })
          .lean();
      },
      CACHE_EXPIRY.HOUR_1,
    );

    res.status(200).json({
      status: "SUCCESS",
      ...MESSAGES_REGISTRY.AUTH.DEVICES_RETRIEVED,
      payload: devices,
    });
    return;
  } catch (error: unknown) {
    console.error("Get Device Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};

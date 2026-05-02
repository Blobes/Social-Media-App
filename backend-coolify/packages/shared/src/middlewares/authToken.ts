import jwt from "jsonwebtoken";
import { Response, NextFunction, RequestHandler } from "express";
import { upstashClient } from "../services/upstash";
import { CACHE_KEYS, getOrSetCache } from "../utils/redis/cache";
import { clearAuthTokens } from "../utils/misc/tokens";
import { DeviceModel } from "@repo/database";
import { IAuthRequest, IJwtUser } from "../types/types";
import { evaluateDeviceTrust } from "../services/device";
import { getOrSetDeviceToken } from "../utils/misc/device";

/**
 * Verifies JWT and validates the hardware mapping against the new Device Registry.
 */
export const verifyAuthToken: RequestHandler = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  let token = req.cookies?.access_token;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      status: "UNAUTHORIZED",
      message: "No token provided",
      payload: null,
    });
  }

  // Ensure a hardware identity hint exists for this and future requests
  const deviceToken = getOrSetDeviceToken(req, res);

  try {
    // JWT Integrity check
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as IJwtUser;

    // Verifying the device exists and isn't stale within the trust window
    const needsOtp = await validateHardwareTrust(
      payload.id,
      deviceToken,
      payload.deviceId,
    );

    if (needsOtp) {
      clearAuthTokens(res);
      return res.status(401).json({
        status: "UNAUTHORIZED",
        message:
          "Device trust expired or unknown hardware. Please re-authenticate.",
      });
    }

    // Verify Redis mapping: sessionId must exist and belong to the payload Device ID
    const sessionKey = CACHE_KEYS.USER_SESSION(payload.id, payload.sessionId);
    const sessionData: any = await upstashClient.get(sessionKey);

    // Comparing the session deviceId against the JWT identity fingerprint
    if (!sessionData || sessionData.deviceId !== payload.deviceId) {
      clearAuthTokens(res);
      return res.status(401).json({
        status: "UNAUTHORIZED",
        message: "Session expired, revoked, or hardware mismatch.",
      });
    }

    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({
      status: "UNAUTHORIZED",
      message: "Invalid or expired token",
      payload: null,
    });
  }
};

/** * Optional Auth: Attaches user data only if hardware and session are valid.
 */
export const optVerifyToken: RequestHandler = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = req.cookies.access_token;
  const deviceToken = req.cookies.device_token;
  if (!token || !deviceToken) return next();

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as IJwtUser;

    const needsOtp = await validateHardwareTrust(
      payload.id,
      deviceToken,
      payload.deviceId,
    );
    if (needsOtp) return next();

    const sessionKey = CACHE_KEYS.USER_SESSION(payload.id, payload.sessionId);
    const sessionData: any = await upstashClient.get(sessionKey);

    if (sessionData && sessionData.deviceId === payload.deviceId) {
      req.user = payload;
    }

    next();
  } catch (err) {
    next();
  }
};

/**
 * Checks the Device Registry (via cache) to see if the device trust is still valid.
 */
export const validateHardwareTrust = async (
  userId: string,
  deviceToken: string | undefined,
  jwtDeviceId: string,
): Promise<boolean> => {
  // We cache the result to prevent hitting MongoDB on every single request
  return await getOrSetCache<boolean>(
    CACHE_KEYS.DEVICE_TRUST_STATUS(userId, deviceToken || "none"),
    async () => {
      if (!deviceToken) return true;
      const device = await DeviceModel.findOne({ userId, deviceToken });
      // If the device doesn't exist, or it's not the one assigned to this JWT session
      if (!device || device._id.toString() !== jwtDeviceId) {
        return true;
      }
      const trust = await evaluateDeviceTrust(device);

      // Return true if verification is required (not trusted)
      return !trust.trusted;
    },
    600, // 10 minutes cache
  );
};

import jwt from "jsonwebtoken";
import { Response, NextFunction, RequestHandler } from "express";
import { upstashClient } from "../services/upstash";
import { CACHE_KEYS, getOrSetCache } from "../utils/redis/cache";
import { clearAuthTokens } from "../utils/misc/tokens";
import { UserModel } from "@repo/database";
import { IAuthRequest, IJwtUser } from "../types/types";
import { requireVerification } from "../utils/misc/deviceTrust";

/**
 * Verifies JWT and validates the hardware mapping against the Trust Registry.
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

  try {
    // JWT INTEGRITY
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as IJwtUser;

    /**
     * HARDWARE TRUST CHECK (The Heartbeat check)
     * We check if the device ID is still trusted in the DB (within 15 days).
     * We cache this for 10 minutes to avoid heavy DB hits on every API call.
     */
    const needsOtp = await validateHardwareTrust(payload.id, payload.deviceId);
    if (needsOtp) {
      clearAuthTokens(res);
      return res.status(401).json({
        status: "UNAUTHORIZED",
        message: "Device trust expired. Please re-authenticate via OTP.",
      });
    }

    /**
     * STATEFUL SESSION & FINGERPRINT MATCH
     * Verify Redis mapping: sessionId must exist AND belong to this deviceId.
     */
    const sessionKey = CACHE_KEYS.USER_SESSION(payload.id, payload.sessionId);
    const sessionData: any = await upstashClient.get(sessionKey);

    const currentDeviceId = req.cookies["device_id"] || "unknown";

    if (!sessionData || sessionData.deviceId !== currentDeviceId) {
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
  if (!token) return next();

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as IJwtUser;

    const needsOtp = await validateHardwareTrust(payload.id, payload.deviceId);
    if (needsOtp) return next();

    const sessionKey = CACHE_KEYS.USER_SESSION(payload.id, payload.sessionId);
    const sessionData: any = await upstashClient.get(sessionKey);
    const currentDeviceId = req.cookies["device_id"] || "unknown";

    if (sessionData && sessionData.deviceId === currentDeviceId) {
      req.user = payload;
    }

    next();
  } catch (err) {
    next();
  }
};

/**
 * Checks the Database (via cache) to see if the device trust is still valid.
 */
export const validateHardwareTrust = async (
  userId: string,
  deviceId: string,
): Promise<boolean> => {
  /**
   * We cache the user's trust registry for 10 minutes.
   * If any other session updates 'updatedAt' or 'trustedDevices',
   * this cache ensures we are reasonably in sync.
   */
  return await getOrSetCache<boolean>(
    CACHE_KEYS.DEVICE_TRUST_STATUS(userId, deviceId),
    async () => {
      const user = await UserModel.findById(userId);
      if (!user) return true; // Force verification if user doesn't exist

      // Logic from our helper: returns true if OTP is required
      return await requireVerification(user, deviceId);
    },
    600, // 10 minutes cache
  );
};

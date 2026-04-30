import jwt from "jsonwebtoken";
import { Response, NextFunction, RequestHandler } from "express";
import { IAuthRequest, IJwtUser } from "../types/types";
import { upstashClient } from "../services/upstash";
import { CACHE_KEYS, getOrSetCache } from "../utils/redis/cache";
import { clearAuthTokens } from "../utils/misc/tokens";
import { UserModel } from "@repo/database";
import { enforcePrimarySessionPolicy } from "../utils/misc/session";

/** * Verifies JWT and validates the session/device fingerprint in Redis.
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
      message: "No token provided",
      status: "UNAUTHORIZED",
      payload: null,
    });
  }

  try {
    // 1. Verify JWT Signature and expiration
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as IJwtUser;

    // Enforce primary session policy
    const isWiped = await validatePrimarySession(payload.id);
    if (isWiped) {
      clearAuthTokens(res);
      return res.status(401).json({
        status: "UNAUTHORIZED",
        message: "Account-wide logout: Primary session has expired.",
      });
    }

    // 2. STATEFUL CHECK: Retrieve session metadata from Redis
    const sessionKey = CACHE_KEYS.USER_SESSION(payload.id, payload.sessionId);
    const sessionData: any = await upstashClient.get(sessionKey);

    if (!sessionData) {
      clearAuthTokens(res);
      return res.status(401).json({
        message: "Session expired or revoked",
        status: "UNAUTHORIZED",
        payload: null,
      });
    }

    // 3. FINGERPRINT CHECK: Ensure the device matches the session owner
    const currentDeviceId = req.cookies["device_id"] || "unknown";
    if (sessionData.deviceId !== currentDeviceId) {
      // Potential session hijacking or cross-device token leak
      clearAuthTokens(res);
      return res.status(401).json({
        message: "Device mismatch: Session restricted to original device",
        status: "UNAUTHORIZED",
        payload: null,
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

/** * Optional Auth: Attaches user data only if the session and device are valid.
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

    const sessionKey = CACHE_KEYS.USER_SESSION(payload.id, payload.sessionId);
    const sessionData: any = await upstashClient.get(sessionKey);
    const currentDeviceId = req.cookies["device_id"] || "unknown";

    if (sessionData && sessionData.deviceId === currentDeviceId) {
      req.user = payload;
    } else if (sessionData && sessionData.deviceId !== currentDeviceId) {
      // Clear tokens if we detect a fingerprint mismatch even in optional routes
      clearAuthTokens(res);
    }

    next();
  } catch (err) {
    next();
  }
};

/** Validates the primary session status and enforces account-wide cleanup if expired.
 * Returns true if a wipe occurred, false otherwise.
 */
export const validatePrimarySession = async (
  userId: string,
): Promise<boolean> => {
  // FETCH PRIMARY ID: Uses the cache-aside helper to avoid hitting MongoDB on every request.
  const primarySessionId = await getOrSetCache<string | null>(
    CACHE_KEYS.USER_PRIMARY_SESSION(userId),
    async () => {
      const user = await UserModel.findById(userId).select("primarySessionId");
      return user?.primarySessionId || null;
    },
    3600, // 1-hour cache
  );
  if (!primarySessionId) return false;
  return await enforcePrimarySessionPolicy(userId, primarySessionId);
};

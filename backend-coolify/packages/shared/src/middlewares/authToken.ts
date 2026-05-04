import jwt from "jsonwebtoken";
import { Response, NextFunction, RequestHandler } from "express";
import { upstashClient } from "../services/upstash";
import { CACHE_KEYS } from "../utils/redis/cache";
import { clearAuthTokens } from "../utils/misc/tokens";
import { IAuthConfig, IAuthRequest, IJwtUser } from "../types/types";
import { validateHardwareTrust } from "../services/device";
import { getOrSetDeviceToken } from "../utils/misc/device";

export const createVerifyAuthToken = (config: IAuthConfig): RequestHandler => {
  return async (
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

    const deviceToken = getOrSetDeviceToken(req, res);

    try {
      // ✅ Use injected secret
      const payload = jwt.verify(token, config.ACCESS_TOKEN_SECRET) as IJwtUser;

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
          payload: null,
        });
      }

      const sessionKey = CACHE_KEYS.USER_SESSION(payload.id, payload.sessionId);

      const sessionData: any = await upstashClient.get(sessionKey);

      if (!sessionData || sessionData.deviceId !== payload.deviceId) {
        clearAuthTokens(res);
        return res.status(401).json({
          status: "UNAUTHORIZED",
          message: "Session expired, revoked, or hardware mismatch.",
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
};

export const createOptionalVerifyToken = (
  config: IAuthConfig,
): RequestHandler => {
  return async (
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    let token = req.cookies?.access_token;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // ✅ Ensure device token consistency
    const deviceToken = getOrSetDeviceToken(req, res);

    if (!token) {
      return next();
    }

    try {
      const payload = jwt.verify(token, config.ACCESS_TOKEN_SECRET) as IJwtUser;

      const needsOtp = await validateHardwareTrust(
        payload.id,
        deviceToken,
        payload.deviceId,
      );

      if (needsOtp) {
        return next(); // silent fail
      }

      const sessionKey = CACHE_KEYS.USER_SESSION(payload.id, payload.sessionId);

      const sessionData: any = await upstashClient.get(sessionKey);

      if (sessionData && sessionData.deviceId === payload.deviceId) {
        req.user = payload;
      }

      return next();
    } catch (err) {
      // Silent failure (expected behavior for optional auth)
      return next();
    }
  };
};

import { Response, RequestHandler } from "express";
import {
  CACHE_KEYS,
  clearAuthTokens,
  finalizeDeviceTrust,
  genAccessTokens,
  IAuthRequest,
  IJwtUser,
  upstashClient,
} from "@repo/shared";
import { UserModel } from "@repo/database";
import jwt from "jsonwebtoken";

/**
 * Validates hardware mapping and updates the trust heartbeat.
 */
export const refreshSession: RequestHandler = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const refreshToken = req.cookies.refresh_token;
  const currentDeviceId = req.cookies["device_id"] || req.body.deviceId;

  if (!refreshToken) {
    return res
      .status(401)
      .json({ status: "ERROR", message: "No refresh token" });
  }

  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string,
    ) as IJwtUser;

    /**
     * MAPPING CHECK 1: JWT to Hardware
     */
    if (payload.deviceId !== currentDeviceId) {
      clearAuthTokens(res);
      return res
        .status(403)
        .json({ status: "FORBIDDEN", message: "Device mismatch" });
    }

    /**
     * MAPPING CHECK 2: Redis Session
     */
    const sessionKey = CACHE_KEYS.USER_SESSION(payload.id, payload.sessionId);
    const sessionData = (await upstashClient.get(sessionKey)) as any;

    if (!sessionData || sessionData.deviceId !== currentDeviceId) {
      clearAuthTokens(res);
      return res
        .status(401)
        .json({ status: "UNAUTHORIZED", message: "Invalid session mapping" });
    }

    /**
     * DB HEARTBEAT
     */
    const user = await UserModel.findById(payload.id);
    if (user) {
      await finalizeDeviceTrust(user, currentDeviceId);
    }

    // Refresh Sliding Window in Redis
    sessionData.lastActive = new Date();
    await upstashClient.set(sessionKey, sessionData, { ex: 20 * 24 * 60 * 60 });

    const jwtUser: IJwtUser = {
      id: payload.id,
      deviceId: payload.deviceId,
      sessionId: payload.sessionId,
    };

    genAccessTokens(jwtUser, req, res, payload.sessionId);

    return res.status(200).json({ status: "SUCCESS", message: "Refreshed" });
  } catch (err) {
    clearAuthTokens(res);
    return res.status(401).json({ status: "ERROR", message: "Invalid token" });
  }
};

import { Response, RequestHandler } from "express";
import {
  CACHE_KEYS,
  clearAuthTokens,
  genAccessTokens,
  getOrSetDeviceToken,
  IAuthRequest,
  IJwtUser,
  toJwtUser,
  upsertDevice,
  upstashClient,
} from "@repo/shared";
import { IUserDocument, UserModel } from "@repo/database";
import jwt from "jsonwebtoken";
import { authTokens } from "@/envVars";

/**
 * Validates hardware mapping and updates the trust heartbeat.
 */
export const refreshSession: RequestHandler = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const refreshToken = req.cookies.refresh_token;

  // Ensure we have a hardware hint even if cookies were just cleared
  const deviceToken = getOrSetDeviceToken(req, res);

  if (!refreshToken) {
    return res
      .status(401)
      .json({ status: "ERROR", message: "No refresh token" });
  }

  try {
    const payload = jwt.verify(
      refreshToken,
      authTokens.REFRESH_TOKEN_SECRET,
    ) as IJwtUser;

    const sessionKey = CACHE_KEYS.USER_SESSION(payload.id, payload.sessionId);
    const sessionData = (await upstashClient.get(sessionKey)) as any;

    // Validate session existence and physical hardware pinning
    if (!sessionData || sessionData.deviceId !== payload.deviceId) {
      clearAuthTokens(res);
      return res
        .status(401)
        .json({ status: "UNAUTHORIZED", message: "Invalid session mapping" });
    }

    const user = await UserModel.findById(payload.id);
    if (!user) {
      clearAuthTokens(res);
      return res
        .status(404)
        .json({ status: "ERROR", message: "User not found" });
    }

    // Heartbeat update which internally repairs primary anchors
    const device = await upsertDevice(user, deviceToken, req);
    const deviceIdString = device._id.toString();

    // Verification of hardware identity against the JWT payload
    if (deviceIdString !== payload.deviceId) {
      clearAuthTokens(res);
      return res
        .status(403)
        .json({ status: "FORBIDDEN", message: "Hardware identity mismatch" });
    }

    // Check if the session survived potential primary anchor rotation
    const sessionExists = await upstashClient.exists(sessionKey);

    if (!sessionExists) {
      clearAuthTokens(res);
      return res.status(401).json({
        status: "UNAUTHORIZED",
        message: "Security anchor rotated. Please log in again.",
      });
    }

    // Extending the sliding window in Redis
    sessionData.lastActive = new Date();
    await upstashClient.set(sessionKey, sessionData, { ex: 20 * 24 * 60 * 60 });

    const jwtUser = toJwtUser(
      user as IUserDocument,
      deviceIdString,
      payload.sessionId,
    );

    const accessToken = genAccessTokens(
      jwtUser,
      req,
      res,
      payload.sessionId,
      authTokens.ACCESS_TOKEN_SECRET,
    );

    return res
      .status(200)
      .json({ status: "SUCCESS", message: "Session refreshed", accessToken });
  } catch (err: any) {
    clearAuthTokens(res);
    return res
      .status(401)
      .json({ status: "ERROR", message: err.message || "Invalid token" });
  }
};

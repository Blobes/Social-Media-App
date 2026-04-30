import jwt from "jsonwebtoken";
import { Response } from "express";
import crypto from "crypto";
import { IAuthRequest } from "../../types/types";
import { upstashClient } from "../../services/upstash";
import { CACHE_KEYS } from "../redis/cache";
import { findUserSessions } from "./session";

export const genAccessTokens = (
  user: any,
  req: IAuthRequest,
  res: Response,
  sessionId: string,
) => {
  const userId = user._id?.toString() || user.id?.toString();
  // We embed the sessionId in the Access Token so the 'protect'
  // middleware can verify the session state in Redis.
  const accessToken = jwt.sign(
    { id: userId, sessionId },
    process.env.JWT_SECRET as string,
    { expiresIn: "15m" },
  );

  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    domain: ".funstakes.net",
    path: "/",
    maxAge: 30 * 60 * 1000,
  });

  // Hint access token cookie
  res.cookie("is_logged_in", "true", {
    httpOnly: false,
    secure: true,
    sameSite: "none",
    maxAge: 30 * 60 * 1000, // Match the expiry of the real token
  });

  return accessToken;
};

/**
 * Generates tokens and ensures a "Single Session Per Device" policy in Redis.
 */
export const genRefreshTokens = async (
  user: any,
  req: IAuthRequest,
  res: Response,
  sessionId: string,
) => {
  const userId = user._id?.toString() || user.id?.toString();
  const deviceId = req.cookies["device_id"] || "unknown";

  // PREVENT DUPLICATE SESSIONS ON SAME DEVICE:
  // Look for any existing sessions for this user that match the current deviceId.
  const existingDeviceSessions = await findUserSessions(
    userId,
    (s) => s.deviceId === deviceId,
  );
  if (existingDeviceSessions.length > 0) {
    const keysToDelete = existingDeviceSessions.map((s) => s.key);
    // Batch delete old sessions for this device to keep Redis clean
    await upstashClient.del(...keysToDelete);
  }

  const refreshToken = jwt.sign(
    { id: userId, sessionId, deviceId },
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: "7d" },
  );

  const sessionKey = CACHE_KEYS.USER_SESSION(userId, sessionId);

  // REGISTER THE NEW SESSION: We set the sliding 20-day window here.
  await upstashClient.set(
    sessionKey,
    {
      deviceId,
      userAgent: req.get("user-agent") || "unknown",
      ip: req.ip || req.headers["x-forwarded-for"] || "unknown",
      lastActive: new Date(),
    },
    { ex: 20 * 24 * 60 * 60 },
  );

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    domain: ".funstakes.net",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return refreshToken;
};

export const clearAuthTokens = (res: Response) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
  res.clearCookie("is_logged_in", {
    httpOnly: false,
    secure: true,
    sameSite: "none",
  });
  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
};

export const genVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashCode = (code: string) => {
  return crypto.createHash("sha256").update(code).digest("hex");
};

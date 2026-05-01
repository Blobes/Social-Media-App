import jwt from "jsonwebtoken";
import { Response } from "express";
import crypto from "crypto";
import { IAuthRequest, IJwtUser } from "../../types/types";
import { upstashClient } from "../../services/upstash";
import { CACHE_KEYS } from "../redis/cache";
import { findUserSessions } from "./session";
import { IUserDocument } from "@repo/database";

/**
 * Generates an Access Token and embeds session/device mapping.
 */
export const genAccessTokens = (
  user: IJwtUser,
  req: IAuthRequest,
  res: Response,
  sessionId: string,
) => {
  const userId = user.id.toString();
  const deviceId = user.deviceId;

  /**
   * We embed both sessionId and deviceId.
   * This allows the 'protect' middleware to verify the mapping in Redis
   * extremely fast without needing a DB lookup.
   */
  const accessToken = jwt.sign(
    { id: userId, sessionId, deviceId },
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

  // Client-side hint for UI logic
  res.cookie("is_logged_in", "true", {
    httpOnly: false,
    secure: true,
    sameSite: "none",
    maxAge: 30 * 60 * 1000,
  });

  return accessToken;
};

/**
 * Generates a signed Refresh JWT and registers the session metadata in Redis.
 */
/**
 * Generates a signed Refresh JWT and registers the session metadata in Redis.
 */
export const genRefreshTokens = async (
  user: IJwtUser,
  req: IAuthRequest,
  res: Response,
  sessionId: string,
) => {
  const userId = user.id.toString();
  const deviceId =
    req.cookies["device_id"] || (req.body && req.body.deviceId) || "unknown";

  /**
   * 1. SIGN THE JWT
   * Both sessionId and deviceId are bound to the token.
   */
  const refreshToken = jwt.sign(
    { id: userId, sessionId, deviceId },
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: "7d" },
  );

  /**
   * 2. REGISTER THE SESSION DATA
   * Maps the session ID to the physical device fingerprint.
   */
  const sessionKey = CACHE_KEYS.USER_SESSION(userId, sessionId);

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

  /**
   * 3. SET THE SECURE COOKIE
   */
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

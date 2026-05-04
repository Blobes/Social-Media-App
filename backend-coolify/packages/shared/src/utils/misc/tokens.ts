import jwt from "jsonwebtoken";
import { Response } from "express";
import crypto from "crypto";
import { IAuthRequest, IJwtUser } from "../../types/types";
import { upstashClient } from "../../services/upstash";
import { CACHE_KEYS } from "../redis/cache";

/**
 * Generates an Access Token and embeds session/device mapping.
 */
export const genAccessTokens = (
  user: IJwtUser,
  req: IAuthRequest,
  res: Response,
  sessionId: string,
  accessTokenSecret: string,
) => {
  // if (!accessTokenSecret) throw "Environment variables has not initialized";

  const userId = user.id.toString();
  const deviceId = user.deviceId;

  // Embedding sessionId and deviceId for high-speed middleware validation
  const accessToken = jwt.sign(
    {
      ...user,
      id: userId,
      deviceId,
      sessionId,
    },
    accessTokenSecret,
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

  // Client-side hint for UI state management
  res.cookie("is_logged_in", "true", {
    httpOnly: false,
    secure: true,
    sameSite: "none",
    domain: ".funstakes.net",
    maxAge: 30 * 60 * 1000,
  });

  return accessToken;
};

/**
 * Generates a signed Refresh JWT and registers the session metadata in Redis.
 */
export const genRefreshTokens = async (
  user: IJwtUser,
  req: IAuthRequest,
  res: Response,
  sessionId: string,
  refreshSecret: string,
) => {
  const userId = user.id.toString();
  const deviceId = user.deviceId;

  // Signing the Refresh JWT with hardware and session binding
  const refreshToken = jwt.sign(
    { id: userId, sessionId, deviceId },
    refreshSecret,
    { expiresIn: "7d" },
  );

  // Mapping the session ID to the physical hardware fingerprint in Redis
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

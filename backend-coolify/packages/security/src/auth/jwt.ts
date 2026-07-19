import jwt from "jsonwebtoken";
import { Response } from "express";
import { CACHE_KEYS, IJwtUser, upstashClient } from "@repo/shared";

/**
 * Generates an Access Token and embeds session/device mapping.
 */
export const signAccessJwt = (
  user: IJwtUser,
  sessionId: string,
  accessTokenSecret: string,
) => {
  const userId = user.id.toString();
  const deviceId = user.deviceId;
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
  return accessToken;
};

/**
 * Generates a signed Refresh JWT and registers the session metadata in Redis.
 */
export const signRefreshJwt = async (
  user: IJwtUser,
  sessionId: string,
  refreshSecret: string,
  userAgent: string,
  ipAddress: string,
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
      userAgent,
      ip: ipAddress,
      lastActive: new Date(),
    },
    { ex: 20 * 24 * 60 * 60 },
  );
  return refreshToken;
};

export const setAuthCookies = (
  res: Response,
  tokens: {
    accessToken?: string;
    refreshToken?: string;
  },
  authType: "ACCESS" | "REFRESH" | "BOTH" = "BOTH",
) => {
  if (tokens.accessToken && (authType === "ACCESS" || authType === "BOTH")) {
    res.cookie("access_token", tokens.accessToken, {
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
  }

  if (tokens.refreshToken && (authType === "REFRESH" || authType === "BOTH")) {
    res.cookie("refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      domain: ".funstakes.net",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
};

export const clearAuthCookies = (res: Response) => {
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

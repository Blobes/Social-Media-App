import jwt from "jsonwebtoken";
import { Response } from "express";
import crypto from "crypto";
import { IAuthRequest } from "../../types/types";
import { upstashClient } from "../../services/upstash";
import { CACHE_KEYS } from "../redis/cache";

export const genAccessTokens = (
  user: any,
  req: IAuthRequest,
  res: Response,
  sessionId: string,
) => {
  const origin = req.get("origin") || "";
  const isLocalDev = origin.includes("localhost");

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
    secure: !isLocalDev,
    sameSite: isLocalDev ? "lax" : "none",
    path: "/",
    maxAge: 15 * 60 * 1000,
  });

  return accessToken;
};

export const genRefreshTokens = async (
  user: any,
  req: IAuthRequest,
  res: Response,
  sessionId: string,
) => {
  const origin = req.get("origin") || "";
  const isLocalDev = origin.includes("localhost");

  const userId = user._id?.toString() || user.id?.toString();

  const refreshToken = jwt.sign(
    { id: userId, sessionId },
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: "7d" },
  );

  // REGISTER SESSION IN UPSTASH
  // We use IAuthRequest to safely access headers and IP
  const sessionKey = CACHE_KEYS.USER_SESSION(userId, sessionId);

  await upstashClient.set(
    sessionKey,
    {
      userAgent: req.get("user-agent") || "unknown",
      ip: req.ip || req.headers["x-forwarded-for"] || "unknown",
      lastActive: new Date(),
    },
    { ex: 7 * 24 * 60 * 60 },
  ); // 7-day TTL to match the Refresh Token

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: !isLocalDev,
    sameSite: isLocalDev ? "lax" : "none",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return refreshToken;
};

export const genVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashCode = (code: string) => {
  return crypto.createHash("sha256").update(code).digest("hex");
};

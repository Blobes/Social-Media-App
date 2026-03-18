import jwt from "jsonwebtoken";
import { Response } from "express";
import crypto from "crypto";
import { IAuthRequest } from "../../types/types";

export const genAccessTokens = (
  user: any,
  req: IAuthRequest,
  res: Response,
) => {
  const origin = req.get("origin") || "";
  const isLocalDev = origin.includes("localhost");

  if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  const userId = user._id?.toString() || user.id?.toString();
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "15m",
    },
  );

  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: !isLocalDev ? "lax" : "none",
    path: "/",
    maxAge: 15 * 60 * 1000,
  });

  return accessToken;
};

export const genRefreshTokens = (
  user: any,
  req: IAuthRequest,
  res: Response,
) => {
  const origin = req.get("origin") || "";
  const isLocalDev = origin.includes("localhost");

  if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    throw new Error(
      "REFRESH_TOKEN_SECRET is not defined in environment variables",
    );
  }
  const userId = user._id?.toString() || user.id?.toString();
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: "7d" },
  );
  // Set token in cookie
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: !isLocalDev ? "lax" : "none",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  return refreshToken;
};

export const genVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashCode = (code: string) => {
  return crypto.createHash("sha256").update(code).digest("hex");
};

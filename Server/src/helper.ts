import jwt from "jsonwebtoken";
import { Response, Request } from "express";
import crypto from "crypto";
import fetch from "node-fetch";

export const genAccessTokens = (user: any, res: Response) => {
  if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  const accessToken = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "30m",
    }
  );
  // Set token in cookie
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 60 * 1000, // 30 minutes
  });
  return accessToken;
};

export const genRefreshTokens = (user: any, res: Response) => {
  if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    throw new Error(
      "REFRESH_TOKEN_SECRET is not defined in environment variables"
    );
  }
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: "7d" }
  );
  // Set token in cookie
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
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

export async function getLocationFromIP(ip: string | undefined) {
  try {
    const response = await fetch(`https://ipwho.is/${ip}`);
    const data = await response.json();

    if (!data.success) return null;

    return {
      country: data.country,
      state: data.region,
      city: data.city,
      isp: data.connection?.isp,
      flag: data.flag?.emoji,
    };
  } catch (err) {
    console.log("Geo error:", err);
    return null;
  }
}

export const getClientIp = (req: Request) => {
  const xff = req.headers["x-forwarded-for"];
  const xRealIp = req.headers["x-real-ip"];

  // Normalize header values that can be string|string[]
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const ip =
    first(xff)?.split(",")[0] || first(xRealIp) || req.socket.remoteAddress;

  return ip;
};

export const generateRandomIP = () => {
  const rand = () => Math.floor(Math.random() * 256); // 0–255
  return `${rand()}.${rand()}.${rand()}.${rand()}`;
};

export const generateTestEmail = (email: string): string => {
  const [username, domain] = email.split("@");
  const randomNumber = Math.floor(1000 + Math.random() * 9000); // random 4-digit
  return `${username}${randomNumber}@${domain}`;
};

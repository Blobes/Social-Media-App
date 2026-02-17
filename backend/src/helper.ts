import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { Response, Request } from "express";
import crypto from "crypto";
import fetch from "node-fetch";
import cors from "cors";
import { AuthRequest } from "./middlewares/verifyAuthToken";

export const genAccessTokens = (user: any, req: AuthRequest, res: Response) => {
  const origin = req.get("origin") || "";
  const isLocalDev = origin.includes("localhost:3000");

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
  // Set access token in private cookie
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: !isLocalDev ? "lax" : "none",
    path: "/",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  return accessToken;
};

export const genRefreshTokens = (
  user: any,
  req: AuthRequest,
  res: Response,
) => {
  const origin = req.get("origin") || "";
  const isLocalDev = origin.includes("localhost:3000");

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

// Configure cors
export const corsConfig = (): any => {
  const allowedOrigins = [
    "http://localhost:3000",
    "https://funstakes.vercel.app",
  ];
  return cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (origin.endsWith(".vercel.app")) return callback(null, true);
      return callback(new Error("CORS: Origin not allowed"));
    },
    credentials: true,
  });
};

//DB Connector
export const connectDB = async (mongoUri: any) => {
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000, // fail fast if cannot connect
      socketTimeoutMS: 45000, // drop dead sockets
      // keepAlive: true,
    });
    // prevent query buffer from timing out too fast
    mongoose.set("bufferTimeoutMS", 20000);
    console.log("✅ DB Connected successfully");
  } catch (err: any) {
    console.error("❌ Initial DB connection failed:", err.message);
    setTimeout(connectDB, 10000); // retry after 10s
  }
};

import jwt from "jsonwebtoken";
import { Response, NextFunction, RequestHandler } from "express";
import { IAuthRequest, IJwtUser } from "../types/types";
import { redisClient } from "../services/redis";
import { CACHE_KEYS } from "../utils/redis/cache";

export const verifyAuthToken: RequestHandler = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const token = req.cookies.access_token;

  if (!token) {
    return res
      .status(401)
      .json({ message: "No token provided", status: "UNAUTHORIZED" });
  }

  try {
    // 1. Verify JWT Signature and expiration
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as IJwtUser;

    // 2. STATEFUL CHECK: Verify the session exists in Upstash
    const sessionKey = CACHE_KEYS.USER_SESSION(payload.id, payload.sessionId);
    const sessionActive = await redisClient.exists(sessionKey);

    if (!sessionActive) {
      // Clear the cookies since the session is revoked in Redis
      res.clearCookie("access_token");
      res.clearCookie("refresh_token");

      return res.status(401).json({
        message: "Session expired or revoked",
        status: "UNAUTHORIZED",
      });
    }

    // Attach user data (including sessionId) to the request
    req.user = payload;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Invalid or expired token", status: "UNAUTHORIZED" });
  }
};

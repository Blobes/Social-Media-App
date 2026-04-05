import jwt from "jsonwebtoken";
import { Response, NextFunction, RequestHandler } from "express";
import { IAuthRequest, IJwtUser } from "../types/types";
import { upstashClient } from "../services/upstash";
import { CACHE_KEYS } from "../utils/redis/cache";

/**
 * Optional Authentication Middleware.
 * If a token exists but the session is revoked in Redis, clear the cookies to keep the client state clean.
 */
export const optVerifyToken: RequestHandler = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = req.cookies.access_token;

  if (!token) return next();

  try {
    // Verify JWT Signature and expiration
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as IJwtUser;

    // STATEFUL CHECK: Verify the session exists in Upstash (Redis)
    const sessionKey = CACHE_KEYS.USER_SESSION(payload.id, payload.sessionId);
    const sessionActive = await upstashClient.exists(sessionKey);

    if (sessionActive) {
      // Attach user data only if the session is still valid in our store
      req.user = payload;
    } else {
      res.clearCookie("access_token");
      res.clearCookie("refresh_token");
    }
    next();
  } catch (err) {
    next();
  }
};

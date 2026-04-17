import jwt from "jsonwebtoken";
import { Response, NextFunction, RequestHandler } from "express";
import { IAuthRequest, IJwtUser } from "../types/types";
import { upstashClient } from "../services/upstash";
import { CACHE_KEYS } from "../utils/redis/cache";
import { clearAuthTokens } from "../utils/misc/tokens";

/**
 * Authentication Verification Middleware.
 */
export const verifyAuthToken: RequestHandler = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  let token = req.cookies?.access_token;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      message: "No token provided",
      status: "UNAUTHORIZED",
      payload: null,
    });
  }

  try {
    // 1. Verify JWT Signature and expiration
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as IJwtUser;

    // 2. STATEFUL CHECK: Verify the session exists in Upstash
    const sessionKey = CACHE_KEYS.USER_SESSION(payload.id, payload.sessionId);
    const sessionActive = await upstashClient.exists(sessionKey);

    if (!sessionActive) {
      // Clear the cookies since the session is revoked in Redis
      clearAuthTokens(res);
      // res.clearCookie("access_token");
      // res.clearCookie("refresh_token");

      return res.status(401).json({
        message: "Session expired or revoked",
        status: "UNAUTHORIZED",
        payload: null,
      });
    }

    // Attach user data (including sessionId) to the request
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({
      status: "UNAUTHORIZED",
      message: "Invalid or expired token",
      payload: null,
    });
  }
};

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
      clearAuthTokens(res);
      // res.clearCookie("access_token");
      // res.clearCookie("refresh_token");
    }
    next();
  } catch (err) {
    next();
  }
};

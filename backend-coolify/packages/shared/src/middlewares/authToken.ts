import jwt from "jsonwebtoken";
import { Response, NextFunction, RequestHandler } from "express";
import { IAuthRequest, IJwtUser } from "../types/types";
import { upstashClient } from "../services/upstash";
import { CACHE_KEYS } from "../utils/redis/cache";
import { genAccessTokens } from "../utils/misc/tokens";

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
    const sessionActive = await upstashClient.exists(sessionKey);

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

/**
 * Validates the refresh token against the stateless JWT check
 * and the stateful Redis session check.
 */
export const refreshAuthToken: RequestHandler = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({
      message: "No refresh token provided",
      status: "UNAUTHORIZED",
    });
  }

  try {
    // 1. Verify the Refresh Token JWT signature
    const payload = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string,
    ) as IJwtUser;

    // 2. STATEFUL CHECK: Verify the session still exists in Redis
    // Experts use this to allow instant global revokes
    const sessionKey = CACHE_KEYS.USER_SESSION(payload.id, payload.sessionId);
    const sessionActive = await upstashClient.exists(sessionKey);

    if (!sessionActive) {
      // Clear cookies if the session was killed in the backend
      res.clearCookie("access_token");
      res.clearCookie("refresh_token");

      return res.status(401).json({
        message: "Session has been revoked",
        status: "UNAUTHORIZED",
      });
    }

    // 3. Generate a fresh Access Token
    // We pass the existing sessionId to maintain the link to the Redis entry
    const user = { id: payload.id };
    genAccessTokens(user, req, res, payload.sessionId);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Token refreshed successfully",
    });
  } catch (err) {
    // Catch-all for expired or tampered JWTs
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");

    return res.status(401).json({
      message: "Expired or invalid refresh token",
      status: "UNAUTHORIZED",
    });
  }
};

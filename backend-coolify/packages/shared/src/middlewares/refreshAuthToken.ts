import jwt from "jsonwebtoken";
import { RequestHandler, Response } from "express";
import { genAccessTokens } from "../utils/misc/tokens";
import { IAuthRequest, IJwtUser } from "../types/types";
import { upstashClient } from "../services/upstash";
import { CACHE_KEYS } from "../utils/redis/cache";

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

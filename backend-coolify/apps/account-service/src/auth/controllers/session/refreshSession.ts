import jwt from "jsonwebtoken";
import { Response, RequestHandler } from "express";
import {
  CACHE_KEYS,
  clearAuthTokens,
  genAccessTokens,
  IAuthRequest,
  IJwtUser,
  upstashClient,
} from "@repo/shared";

/**
 * Validates the refresh token against the stateless JWT check
 * and the stateful Redis session check.
 */
export const refreshSession: RequestHandler = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({
      status: "UNAUTHORIZED",
      message: "No refresh token provided",
      payload: null,
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
      clearAuthTokens(res);

      return res.status(401).json({
        status: "UNAUTHORIZED",
        message: "Session has been revoked",
        payload: null,
      });
    }

    // 3. Generate a fresh Access Token
    // We pass the existing sessionId to maintain the link to the Redis entry
    const user = { id: payload.id };
    genAccessTokens(user, req, res, payload.sessionId);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Token refreshed successfully",
      payload: null,
    });
  } catch (err) {
    // Catch-all for expired or tampered JWTs
    clearAuthTokens(res);

    return res.status(401).json({
      status: "UNAUTHORIZED",
      message: "Expired or invalid refresh token",
      payload: null,
    });
  }
};

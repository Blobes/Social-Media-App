import { UserModel } from "@repo/database";
import {
  IAuthRequest,
  userSensitiveFields,
  CACHE_KEYS,
  upstashClient,
  validatePrimarySession,
  clearAuthTokens,
} from "@repo/shared";
import { RequestHandler, Response } from "express";

export const verifySession: RequestHandler = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const userId = req.user?.id;
  const sessionId = req.user?.sessionId;

  if (!userId || !sessionId) {
    return res.status(401).json({
      status: "ERROR",
      message: "Invalid or expired session",
      payload: null,
    });
  }

  try {
    const user = await UserModel.findById(userId);

    // Check if the primary session is still valid before extending the heartbeat
    const isWiped = await validatePrimarySession(userId);
    if (isWiped) {
      clearAuthTokens(res);
      return res
        .status(401)
        .json({ status: "ERROR", message: "Primary session expired" });
    }

    if (!user) {
      // If user is missing or deactivated (caught by middleware/pre-find),
      // we should also kill the Redis session immediately.
      await upstashClient.del(CACHE_KEYS.USER_SESSION(userId, sessionId));

      return res.status(401).json({
        status: "ERROR",
        message: "User account not found",
        payload: null,
      });
    }

    // UPDATE HEARTBEAT: Extend session life or just update last active
    const sessionKey = CACHE_KEYS.USER_SESSION(userId, sessionId);
    const deviceId = req.cookies["device_id"] || "unknown";

    await upstashClient.set(
      sessionKey,
      {
        deviceId,
        userAgent: req.get("user-agent") || "unknown",
        ip: req.ip || "unknown",
        lastActive: new Date(),
      },
      { ex: 20 * 24 * 60 * 60 },
    ); // keepTtl ensures we don't reset the 20-day expiration

    const safePayload = user.toObject();
    userSensitiveFields().forEach((field) => {
      delete (safePayload as any)[field];
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Session is valid",
      payload: safePayload,
    });
  } catch (error: any) {
    console.error("Session Verification Error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Server error during session check",
      payload: null,
    });
  }
};

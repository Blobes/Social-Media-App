import { UserModel } from "@repo/database";
import {
  IAuthRequest,
  userSensitiveFields,
  CACHE_KEYS,
  upstashClient,
  clearAuthTokens,
  finalizeDeviceTrust,
  validateHardwareTrust,
} from "@repo/shared";
import { RequestHandler, Response } from "express";

/**
 * Validates the session state, hardware fingerprint, and 15-day trust window.
 */
export const verifySession: RequestHandler = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const userId = req.user?.id;
  const sessionId = req.user?.sessionId;
  const deviceId = req.cookies["device_id"] || "unknown";

  if (!userId || !sessionId) {
    return res.status(401).json({
      status: "ERROR",
      message: "Invalid or expired session context",
      payload: null,
    });
  }

  try {
    /**
     * 1. HARDWARE TRUST (Replacement for validatePrimarySession)
     * This checks if the device is authorized and if the 15-day window is valid.
     */
    const needsOtp = await validateHardwareTrust(userId, deviceId);

    if (needsOtp) {
      clearAuthTokens(res);
      return res.status(401).json({
        status: "ERROR",
        message: "Device trust has expired. Verification required.",
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      await upstashClient.del(CACHE_KEYS.USER_SESSION(userId, sessionId));
      clearAuthTokens(res);
      return res.status(401).json({
        status: "ERROR",
        message: "User account not found",
        payload: null,
      });
    }

    /**
     * 2. ACTIVE SESSION MAPPING
     * Verify this specific sessionId is actually mapped to this physical device.
     */
    const sessionKey = CACHE_KEYS.USER_SESSION(userId, sessionId);
    const sessionData: any = await upstashClient.get(sessionKey);

    if (!sessionData || sessionData.deviceId !== deviceId) {
      clearAuthTokens(res);
      return res.status(401).json({
        status: "ERROR",
        message: "Session hardware mismatch or session revoked.",
      });
    }

    /**
     * 3. DB HEARTBEAT (Update the 15-day sliding window)
     * Since this is a successful handshake, we refresh the trust in the DB.
     */
    await finalizeDeviceTrust(user, deviceId);

    /**
     * 4. CACHE HEARTBEAT
     * Update Redis to keep the active session alive.
     */
    await upstashClient.set(
      sessionKey,
      {
        ...sessionData,
        lastActive: new Date(),
      },
      { ex: 20 * 24 * 60 * 60 },
    );

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

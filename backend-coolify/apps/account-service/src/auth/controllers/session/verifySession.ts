import { UserModel } from "@repo/database";
import {
  IAuthRequest,
  userSensitiveFields,
  CACHE_KEYS,
  upstashClient,
  clearAuthTokens,
  validateHardwareTrust,
  upsertDevice,
  getOrSetDeviceToken,
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
  const jwtDeviceId = req.user?.deviceId;

  // Ensure an identity hint exists if the user cleared their cookies
  const deviceToken = getOrSetDeviceToken(req, res);

  if (!userId || !sessionId || !jwtDeviceId) {
    return res.status(401).json({
      status: "ERROR",
      message: "Invalid or expired session context",
      payload: null,
    });
  }

  try {
    // Physical device token validation against the 15-day trust window
    const needsOtp = await validateHardwareTrust(
      userId,
      deviceToken,
      jwtDeviceId,
    );

    if (needsOtp) {
      clearAuthTokens(res);
      return res.status(401).json({
        status: "ERROR",
        message:
          "Device trust has expired or hardware unknown. Verification required.",
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

    const sessionKey = CACHE_KEYS.USER_SESSION(userId, sessionId);
    const sessionData: any = await upstashClient.get(sessionKey);

    // Verifying Redis session existence and hardware pinning
    if (!sessionData || sessionData.deviceId !== jwtDeviceId) {
      clearAuthTokens(res);
      return res.status(401).json({
        status: "ERROR",
        message: "Session hardware mismatch or session revoked.",
      });
    }

    // Registry heartbeat update which internally calls ensurePrimaryDevice
    const device = await upsertDevice(user, deviceToken, req);

    // Identity pinning check against the registry database record
    if (device._id.toString() !== jwtDeviceId) {
      clearAuthTokens(res);
      return res.status(403).json({
        status: "FORBIDDEN",
        message: "Hardware identity mismatch.",
        payload: null,
      });
    }

    // Verifying if session survived the primary rotation cleanup logic
    const sessionExists = await upstashClient.exists(sessionKey);

    if (!sessionExists) {
      clearAuthTokens(res);
      return res.status(401).json({
        status: "UNAUTHORIZED",
        message: "Security anchor rotated. Please re-authenticate.",
        payload: null,
      });
    }

    // Updating the sliding window for the active session in Redis
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

import { UserModel } from "@repo/database";
import {
  CACHE_KEYS,
  validateHardwareTrust,
  upsertDevice,
  upstashClient,
  userSensitiveFields,
  MESSAGES_REGISTRY,
  TransInfo,
} from "@repo/shared";

interface IVerifySessionInput {
  userId?: string;
  sessionId?: string;
  jwtDeviceId?: string;
  deviceToken: string;
  userAgent: string;
}

interface IVerifySessionResult {
  status:
    | "SUCCESS"
    | "CONTEXT_MISSING"
    | "TRUST_EXPIRED"
    | "USER_NOT_FOUND"
    | "SESSION_MISMATCH"
    | "HARDWARE_MISMATCH"
    | "ANCHOR_ROTATED";
  transInfo?: TransInfo;
  payload?: any;
}

/**
 * Validates active session state, hardware fingerprints, and sliding window policies.
 */
export const executeSessionVerification = async (
  input: IVerifySessionInput,
): Promise<IVerifySessionResult> => {
  const { userId, sessionId, jwtDeviceId, deviceToken, userAgent } = input;

  if (!userId || !sessionId || !jwtDeviceId) {
    return {
      status: "CONTEXT_MISSING",
      transInfo: MESSAGES_REGISTRY.AUTH.INVALID_SESSION,
    };
  }

  const needsOtp = await validateHardwareTrust(
    userId,
    deviceToken,
    jwtDeviceId,
  );
  if (needsOtp) {
    return {
      status: "TRUST_EXPIRED",
      transInfo: MESSAGES_REGISTRY.AUTH.DEVICE_TRUST_EXPIRED,
    };
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    await upstashClient.del(CACHE_KEYS.USER_SESSION(userId, sessionId));
    return {
      status: "USER_NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  const sessionKey = CACHE_KEYS.USER_SESSION(userId, sessionId);
  const sessionData: any = await upstashClient.get(sessionKey);

  if (!sessionData || sessionData.deviceId !== jwtDeviceId) {
    return {
      status: "SESSION_MISMATCH",
      transInfo: MESSAGES_REGISTRY.AUTH.SESSIONS_EXPIRED,
    };
  }

  const device = await upsertDevice(user, deviceToken, userAgent);
  if (device._id.toString() !== jwtDeviceId) {
    return {
      status: "HARDWARE_MISMATCH",
      transInfo: MESSAGES_REGISTRY.AUTH.HARDWARE_ID_MISMATCH,
    };
  }

  const sessionExists = await upstashClient.exists(sessionKey);
  if (!sessionExists) {
    return {
      status: "ANCHOR_ROTATED",
      transInfo: MESSAGES_REGISTRY.AUTH.SECURITY_ANCHOR_ROTATED,
    };
  }

  await upstashClient.set(
    sessionKey,
    {
      ...sessionData,
      lastActive: new Date(),
    },
    { ex: 20 * 24 * 60 * 60 },
  );

  user.lastActiveAt = new Date();
  user.save();

  const safePayload = user.toObject();
  userSensitiveFields().forEach((field) => {
    delete (safePayload as any)[field];
  });

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.SESSION_VALID,
    payload: safePayload,
  };
};

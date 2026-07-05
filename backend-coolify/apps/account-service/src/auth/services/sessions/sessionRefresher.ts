import { authTokens } from "@/envVars";
import { IUserDocument, UserModel } from "@repo/database";
import {
  CACHE_KEYS,
  signAccessJwt,
  IJwtUser,
  toJwtUser,
  upsertDevice,
  upstashClient,
  MESSAGES_REGISTRY,
  TransInfo,
} from "@repo/shared";
import jwt from "jsonwebtoken";

interface IRefreshSessionInput {
  refreshToken: string;
  deviceToken: string;
  userAgent: string;
}

interface IRefreshSessionResult {
  status:
    | "SUCCESS"
    | "INVALID_SESSION"
    | "USER_NOT_FOUND"
    | "HARDWARE_MISMATCH"
    | "ANCHOR_ROTATED";
  transInfo?: TransInfo;
  accessToken?: string;
}

/**
 * Validates the hardware session mapping state and generates an updated access token.
 */
export const executeSessionRefresh = async (
  input: IRefreshSessionInput,
): Promise<IRefreshSessionResult> => {
  const { refreshToken, deviceToken, userAgent } = input;

  try {
    const payload = jwt.verify(
      refreshToken,
      authTokens.REFRESH_TOKEN_SECRET,
    ) as IJwtUser;

    const sessionKey = CACHE_KEYS.USER_SESSION(payload.id, payload.sessionId);
    const sessionData = (await upstashClient.get(sessionKey)) as any;

    if (!sessionData || sessionData.deviceId !== payload.deviceId) {
      return {
        status: "INVALID_SESSION",
        transInfo: MESSAGES_REGISTRY.AUTH.INVALID_SESSION_MAPPING,
      };
    }

    const user = await UserModel.findById(payload.id);
    if (!user) {
      return {
        status: "USER_NOT_FOUND",
        transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
      };
    }

    const device = await upsertDevice(user, deviceToken, userAgent);
    const deviceIdString = device._id.toString();

    if (deviceIdString !== payload.deviceId) {
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

    sessionData.lastActive = new Date();
    await upstashClient.set(sessionKey, sessionData, { ex: 20 * 24 * 60 * 60 });

    const jwtUser = toJwtUser(
      user as IUserDocument,
      deviceIdString,
      payload.sessionId,
    );

    const accessToken = signAccessJwt(
      jwtUser,
      payload.sessionId,
      authTokens.ACCESS_TOKEN_SECRET,
    );

    return {
      status: "SUCCESS",
      transInfo: MESSAGES_REGISTRY.AUTH.SESSION_REFRESHED,
      accessToken,
    };
  } catch (err: any) {
    throw new Error(
      err.message || MESSAGES_REGISTRY.AUTH.INVALID_TOKEN.message,
    );
  }
};

import mongoose from "mongoose";
import { authTokens } from "@/envVars";
import { IUserDocument, ModerationDecision } from "@repo/database";
import {
  userSensitiveFields,
  CACHE_KEYS,
  toJwtUser,
  upsertDevice,
  evaluateDeviceTrust,
  MESSAGES_REGISTRY,
  TransInfo,
  getAccountStatusMsg,
  setCache,
  sanitizeUserResult,
  fetchSingleUser,
} from "@repo/shared";
import { v4 as uuidv4 } from "uuid";
import { executeAccountCheck } from "../../check/service";
import { verifyEncryptedPass } from "@/auth/helpers/encrypt";
import { signAccessJwt, signRefreshJwt } from "@repo/security";

interface ILoginInput {
  identifier: string;
  password: string;
  deviceToken: string;
  userAgent: string;
  ipAddress: string;
}

interface ILoginResult {
  status:
    | "SUCCESS"
    | "USER_NOT_FOUND"
    | "NO_USER_PASSWORD_SET"
    | "UNAUTHORIZED"
    | "THIRD_PARTY_RESTRICTION"
    | "ACCOUNT_ACTIVE"
    | "ACCOUNT_INACTIVE"
    | ModerationDecision;
  transInfo?: TransInfo;
  accessToken?: string;
  refreshToken?: string;
  payload?: Record<string, unknown>;
  requireOtp?: boolean;
  otpReason?: "UNVERIFIED_ACCOUNT" | "UNTRUSTED_DEVICE";
}

/**
 * Executes the login business logic including credential comparison, device registry, and session generation.
 */
export const authenticateUser = async (
  input: ILoginInput,
): Promise<ILoginResult> => {
  const { identifier, password, deviceToken, userAgent, ipAddress } = input;

  // Reusing validation rules and third-party restrictions from service check layer
  const checkResult = await executeAccountCheck({
    identifier,
    purpose: "LOGIN",
  });

  if (checkResult.status === "NOT_FOUND") {
    return {
      status: "USER_NOT_FOUND",
      transInfo: { ...checkResult.transInfo },
    };
  }

  if (checkResult.status === "THIRD_PARTY_RESTRICTION") {
    return {
      status: "THIRD_PARTY_RESTRICTION",
      transInfo: { ...checkResult.transInfo },
    };
  }

  const accountStatus = checkResult.payload?.accountStatus;
  if (
    accountStatus === "DEACTIVATED" ||
    accountStatus === "SUSPENDED" ||
    accountStatus === "BANNED"
  ) {
    const restrictionMsg = getAccountStatusMsg(accountStatus, "RESTRICTED");
    return restrictionMsg;
  }

  // Fetch user payload bypassing filters and retaining sensitive fields for authentication
  const user = await fetchSingleUser({
    identifier: checkResult.payload?.userId,
    flags: {
      lean: false,
      includeLanguage: true,
      skipFilter: true,
      includeSensitiveFields: true,
    },
  });

  if (!user) {
    return {
      status: "USER_NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  const userPassword = user.password;
  if (!userPassword) {
    return {
      status: "NO_USER_PASSWORD_SET",
      transInfo: MESSAGES_REGISTRY.AUTH.NO_PASSWORD_SET,
    };
  }

  const isMatch = await verifyEncryptedPass(password, userPassword);
  if (!isMatch) {
    return {
      status: "UNAUTHORIZED",
      transInfo: MESSAGES_REGISTRY.AUTH.INCORRECT_CURRENT_PASSWORD,
    };
  }

  const device = await upsertDevice(
    user as unknown as IUserDocument,
    deviceToken,
    userAgent,
  );

  const userId = user._id.toString();
  const deviceIdString = device._id.toString();
  const sessionId = uuidv4();

  const primaryDeviceId = user.primaryDeviceId as
    | mongoose.Types.ObjectId
    | undefined;

  await setCache(
    CACHE_KEYS.USER_PRIMARY_DEVICE(userId),
    primaryDeviceId?.toString(),
  );

  const jwtUser = toJwtUser(
    user as unknown as IUserDocument,
    deviceIdString,
    sessionId,
  );

  const accessToken = signAccessJwt(
    jwtUser,
    sessionId,
    authTokens.ACCESS_TOKEN_SECRET,
  );

  const refreshToken = await signRefreshJwt(
    jwtUser,
    sessionId,
    authTokens.REFRESH_TOKEN_SECRET,
    userAgent,
    ipAddress,
  );

  // Perform atomic update for active status timestamps without triggering a redundant full read
  await user.updateOne(
    { _id: user._id },
    {
      $set: {
        lastPasswordVerifiedAt: new Date(),
        lastActiveAt: new Date(),
      },
    },
  );

  // // Create safe payload output by removing sensitive fields
  // const safeData: Record<string, unknown> = {
  //   ...userPayload,
  //   language: userPayload.additions?.language,
  // };
  // userSensitiveFields().forEach((field) => {
  //   delete safeData[field];
  // });

  const safeData = sanitizeUserResult(user, userSensitiveFields());

  const finalPayload = { ...safeData, language: safeData.additions?.language };

  const trust = await evaluateDeviceTrust(device);
  const isVerified =
    Boolean(user.isEmailVerified) || Boolean(user.isPhoneVerified);
  const requireOtp = !isVerified || !trust.trusted;

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.LOGGED_IN_SUCCESSFULLY,
    accessToken,
    refreshToken,
    payload: finalPayload,
    requireOtp,
    otpReason: requireOtp
      ? !isVerified
        ? "UNVERIFIED_ACCOUNT"
        : "UNTRUSTED_DEVICE"
      : undefined,
  };
};

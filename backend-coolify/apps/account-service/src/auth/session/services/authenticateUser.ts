import { authTokens } from "@/envVars";
import { IUserDocument, ModerationDecision, UserModel } from "@repo/database";
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
} from "@repo/shared";
import { v4 as uuidv4 } from "uuid";
import { CheckType, executeAccountCheck } from "../../check/service";
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
  payload?: any;
  requireOtp?: boolean;
  otpReason?: "UNVERIFIED_ACCOUNT" | "UNTRUSTED_DEVICE";
}

/**
 * Resolves the verification input check-type based on input text structure.
 */
const determineCheckType = (identifier: string): CheckType => {
  if (identifier.includes("@")) return "EMAIL";
  if (/^\+?\d+$/.test(identifier.replace(/\s+/g, ""))) return "PHONE";
  return "USERNAME";
};

/**
 * Executes the login business logic including credential comparison, device registry, and session generation.
 */
export const authenticateUser = async (
  input: ILoginInput,
): Promise<ILoginResult> => {
  const { identifier, password, deviceToken, userAgent, ipAddress } = input;

  const resolvedType = determineCheckType(identifier);

  // Reusing validation rules and third-party restrictions from service check layer
  const checkResult = await executeAccountCheck({
    type: resolvedType,
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
    const restrictionMsg = getAccountStatusMsg(accountStatus, "restricted");
    return restrictionMsg;
  }

  // Fetch complete user document for cryptographic verification operations
  const user = await UserModel.findById(checkResult.payload?.userId).setOptions(
    {
      skipFilter: true,
    },
  );

  if (!user) {
    return {
      status: "USER_NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  if (!user.password) {
    return {
      status: "NO_USER_PASSWORD_SET",
      transInfo: MESSAGES_REGISTRY.AUTH.NO_PASSWORD_SET,
    };
  }

  // const isMatch = await bcrypt.compare(password, user.password);
  const isMatch = await verifyEncryptedPass(password, user.password);
  if (!isMatch) {
    return {
      status: "UNAUTHORIZED",
      transInfo: MESSAGES_REGISTRY.AUTH.INCORRECT_CURRENT_PASSWORD,
    };
  }

  const device = await upsertDevice(user, deviceToken, userAgent);

  const userId = user._id.toString();
  const deviceIdString = device._id.toString();
  const sessionId = uuidv4();

  await setCache(
    CACHE_KEYS.USER_PRIMARY_DEVICE(userId),
    user.primaryDeviceId?.toString(),
  );

  const jwtUser = toJwtUser(user as IUserDocument, deviceIdString, sessionId);

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

  user.lastPasswordVerifiedAt = new Date();
  user.lastActiveAt = new Date();
  await user.save();

  const safeData = user.toObject();
  userSensitiveFields().forEach((field) => {
    delete (safeData as any)[field];
  });

  const trust = await evaluateDeviceTrust(device);
  const isVerified = safeData.isEmailVerified || safeData.isPhoneVerified;
  const requireOtp = !isVerified || !trust.trusted;

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.LOGGED_IN_SUCCESSFULLY,
    accessToken,
    refreshToken,
    payload: safeData,
    requireOtp,
    otpReason: requireOtp
      ? !isVerified
        ? "UNVERIFIED_ACCOUNT"
        : "UNTRUSTED_DEVICE"
      : undefined,
  };
};

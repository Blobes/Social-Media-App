import { authTokens } from "@/envVars";
import {
  ILocation,
  IUserDocument,
  ModerationDecision,
  UserModel,
} from "@repo/database";
import {
  fetchSingleUser,
  getAccountStatusMsg,
  getLocationFromIp,
  MESSAGES_REGISTRY,
  sanitizeUserResult,
  toJwtUser,
  TransInfo,
  upsertDevice,
  userSensitiveFields,
} from "@repo/shared";
import { v4 as uuidv4 } from "uuid";
import { executeAccountCheck } from "../check/service";
import {
  IOAuthProfile,
  verifyAppleToken,
  verifyGoogleToken,
} from "./oAuthClients";
import { signAccessJwt, signRefreshJwt } from "@repo/security";

export type OAuthProvider = "GOOGLE" | "APPLE";
export type OAuthPurpose = "REGISTRATION" | "LOGIN";

interface IOAuthAuthInput {
  provider: OAuthProvider;
  idToken: string;
  deviceToken: string;
  userAgent: string;
  ipAddress: string;
  purpose: OAuthPurpose;
  identityPayload?: {
    firstName?: string;
    lastName?: string;
  };
}

interface IOAuthAuthResult {
  status:
    | "SUCCESS"
    | "MERGE_RESTRICTION"
    | "EMAIL_NOT_FOUND"
    | "USER_NOT_FOUND"
    | "CONFLICT_EMAIL_IN_USE"
    | "ACCOUNT_ACTIVE"
    | "ACCOUNT_INACTIVE"
    | "UNSUPPORTED_OAUTH_PROVIDER"
    | "INVALID_OAUTH_TOKEN"
    | ModerationDecision;
  transInfo?: TransInfo;
  accessToken?: string;
  refreshToken?: string;
  payload?: unknown;
}

/**
 * Validates third-party provider ID tokens and routes requests via explicit purpose-driven registration or login pipelines.
 */
export const authenticateWithOAuth = async (
  input: IOAuthAuthInput,
): Promise<IOAuthAuthResult> => {
  const {
    provider,
    idToken,
    deviceToken,
    userAgent,
    ipAddress,
    purpose,
    identityPayload,
  } = input;

  let profile: IOAuthProfile;

  // Single unified try-catch block handling token verification for all supported providers
  try {
    if (provider === "GOOGLE") {
      profile = await verifyGoogleToken(idToken);
    } else if (provider === "APPLE") {
      profile = await verifyAppleToken(idToken);
      if (identityPayload) {
        profile.firstName = profile.firstName || identityPayload.firstName;
        profile.lastName = profile.lastName || identityPayload.lastName;
      }
    } else {
      return {
        status: "UNSUPPORTED_OAUTH_PROVIDER",
        transInfo: MESSAGES_REGISTRY.AUTH.UNSUPPORTED_OAUTH_PROVIDER,
      };
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "INVALID_OAUTH_TOKEN") {
      return {
        status: "INVALID_OAUTH_TOKEN",
        transInfo: MESSAGES_REGISTRY.AUTH.INVALID_OAUTH_TOKEN,
      };
    }
    throw error;
  }

  // Routing identifier checking logic through primary check layer
  const checkResult = await executeAccountCheck({
    identifierType: "EMAIL",
    identifier: profile.email,
    purpose,
  });
  const accountStatus = checkResult.payload?.accountStatus;

  // --- Registration purpose pipeline ---
  if (purpose === "REGISTRATION") {
    if (checkResult.isExisting) {
      if (
        accountStatus === "DEACTIVATED" ||
        accountStatus === "SUSPENDED" ||
        accountStatus === "BANNED"
      ) {
        const restrictionMsg = getAccountStatusMsg(accountStatus, "RESTRICTED");
        return restrictionMsg;
      }
      return {
        status: "CONFLICT_EMAIL_IN_USE",
        transInfo: MESSAGES_REGISTRY.AUTH.EMAIL_ALREADY_REGISTERED,
      };
    }

    const geoData = await getLocationFromIp(ipAddress);
    const location = geoData
      ? ({
          name: `${geoData.city}, ${geoData.state}, ${geoData.country}`,
          city: geoData.city,
          state: geoData.state,
          country: geoData.country,
          type: "Point" as const,
          coordinates: [Number(geoData.longitude), Number(geoData.latitude)],
        } as ILocation)
      : undefined;

    const newUser: IUserDocument = new UserModel({
      email: profile.email,
      oAuthId: profile.providerId,
      signedUpWith: provider,
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      isEmailVerified: true,
      location,
      lastActiveAt: new Date(),
    });
    await newUser.save();

    const device = await upsertDevice(newUser, deviceToken, userAgent);
    const sessionId = uuidv4();
    const jwtUser = toJwtUser(newUser, device._id.toString(), sessionId);

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

    const safeData = sanitizeUserResult(newUser, userSensitiveFields());

    return {
      status: "SUCCESS",
      transInfo:
        MESSAGES_REGISTRY.AUTH.REGISTRATION_SUCCESSFUL_VIA_OAUTH(provider),
      accessToken,
      refreshToken,
      payload: safeData,
    };
  }

  // --- Login purpose pipeline ---
  if (checkResult.status === "NOT_FOUND") {
    return {
      status: "EMAIL_NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.EMAIL_NOT_FOUND,
    };
  }
  if (
    accountStatus === "DEACTIVATED" ||
    accountStatus === "SUSPENDED" ||
    accountStatus === "BANNED"
  ) {
    const restrictionMsg = getAccountStatusMsg(accountStatus, "RESTRICTED");
    return restrictionMsg;
  }

  const user = await fetchSingleUser({
    identifier: checkResult.payload?.userId,
    flags: { lean: false, skipFilter: true },
  });

  if (!user) {
    return {
      status: "USER_NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  // Enforcing third-party mapping restriction checks based on registration origin
  if (
    user.signedUpWith &&
    user.signedUpWith !== "EMAIL" &&
    user.signedUpWith !== provider
  ) {
    return {
      status: "MERGE_RESTRICTION",
      transInfo: MESSAGES_REGISTRY.AUTH.OAUTH_PROVIDER_CONFLICT(provider),
    };
  }

  // Binding the generic identity identifier if missing, leaving signedUpWith unaltered
  if (!user.oAuthId) {
    user.oAuthId = profile.providerId;
    user.lastActiveAt = new Date();
    await user.save();
  }

  const device = await upsertDevice(user, deviceToken, userAgent);
  const sessionId = uuidv4();
  const jwtUser = toJwtUser(user, device._id.toString(), sessionId);

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

  const safeData = sanitizeUserResult(user, userSensitiveFields());

  return {
    status: "SUCCESS",
    transInfo:
      MESSAGES_REGISTRY.AUTH.LOGGED_IN_SUCCESSFULLY_VIA_OAUTH(provider),
    accessToken,
    refreshToken,
    payload: safeData,
  };
};

import { authTokens } from "@/envVars";
import { UserModel } from "@repo/database";
import {
  MESSAGES_REGISTRY,
  signAccessJwt,
  signRefreshJwt,
  toJwtUser,
  TransInfo,
  upsertDevice,
  userSensitiveFields,
} from "@repo/shared";
import { v4 as uuidv4 } from "uuid";
import { executeAccountCheck } from "../services/accountChecker";
import {
  IOAuthProfile,
  verifyAppleToken,
  verifyGoogleToken,
} from "./oAuthClients";

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
    | "DEACTIVATED"
    | "MERGE_RESTRICTION"
    | "NOT_FOUND"
    | "CONFLICT_EMAIL_IN_USE";
  transInfo?: TransInfo;
  accessToken?: string;
  refreshToken?: string;
  payload?: any;
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

  if (provider === "GOOGLE") {
    profile = await verifyGoogleToken(idToken);
  } else if (provider === "APPLE") {
    profile = await verifyAppleToken(idToken);
    if (identityPayload) {
      profile.firstName = profile.firstName || identityPayload.firstName;
      profile.lastName = profile.lastName || identityPayload.lastName;
    }
  } else {
    throw new Error("UNSUPPORTED_OAUTH_PROVIDER");
  }

  // Route identifier checking logic through primary check layer
  const checkResult = await executeAccountCheck({
    type: "EMAIL",
    identifier: profile.email,
    purpose,
  });

  // ── REGISTRATION PURPOSE PIPELINE ──────────────────────────────────────────
  if (purpose === "REGISTRATION") {
    if (checkResult.isExisting) {
      if (checkResult.payload?.accountStatus === "DEACTIVATED") {
        return {
          status: "DEACTIVATED",
          transInfo: MESSAGES_REGISTRY.AUTH.ACCOUNT_DEACTIVATED,
        };
      }
      return {
        status: "CONFLICT_EMAIL_IN_USE",
        transInfo: MESSAGES_REGISTRY.AUTH.EMAIL_ALREADY_REGISTERED,
      };
    }

    const newUser = new UserModel({
      email: profile.email,
      oAuthId: profile.providerId,
      signedUpWith: provider,
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      isEmailVerified: true,
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

    const safeData = newUser.toObject();
    userSensitiveFields().forEach((field) => {
      delete (safeData as any)[field];
    });

    return {
      status: "SUCCESS",
      transInfo:
        MESSAGES_REGISTRY.AUTH.REGISTRATION_SUCCESSFUL_VIA_OAUTH(provider),
      accessToken,
      refreshToken,
      payload: safeData,
    };
  }

  // ── LOGIN PURPOSE PIPELINE ─────────────────────────────────────────────────
  if (checkResult.status === "NOT_FOUND") {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.EMAIL_NOT_FOUND,
    };
  }

  if (checkResult.payload?.accountStatus === "DEACTIVATED") {
    return {
      status: "DEACTIVATED",
      ...checkResult.transInfo,
    };
  }

  const user = await UserModel.findById(checkResult.payload?.userId).setOptions(
    {
      skipFilter: true,
    },
  );

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  // Enforce third-party mapping restriction checks based on registration origin
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

  // Bind the generic identity identifier if missing, leaving signedUpWith unaltered
  if (!user.oAuthId) {
    user.oAuthId = profile.providerId;
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

  const safeData = user.toObject();
  userSensitiveFields().forEach((field) => {
    delete (safeData as any)[field];
  });

  return {
    status: "SUCCESS",
    transInfo:
      MESSAGES_REGISTRY.AUTH.LOGGED_IN_SUCCESSFULLY_VIA_OAUTH(provider),
    accessToken,
    refreshToken,
    payload: safeData,
  };
};

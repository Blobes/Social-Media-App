import mongoose from "mongoose";
import { AccountStatus } from "@repo/database";
import {
  fetchSingleUser,
  fetchManyUsers,
  InputCheckType,
  MESSAGES_REGISTRY,
  normalizeValue,
  transformToASCII,
  TransInfo,
} from "@repo/shared";

export type CheckPurpose = "REGISTRATION" | "LOGIN";

export interface CheckInput {
  identifier: string;
  type?: InputCheckType;
  purpose?: CheckPurpose;
}

export interface CheckResult {
  status:
    | "SUCCESS"
    | "MISSING_IDENTIFIER"
    | "THIRD_PARTY_RESTRICTION"
    | "NOT_FOUND";
  transInfo?: TransInfo;
  isExisting?: boolean;
  signedUpWith?: "EMAIL" | "GOOGLE" | "APPLE";
  suggestions?: string[];
  payload?: {
    accountStatus: AccountStatus;
    userId: string | mongoose.Types.ObjectId;
    username?: string;
    firstName?: string;
    email?: string;
    phone?: string;
  } | null;
}

interface IAccountCheckProjection {
  _id: mongoose.Types.ObjectId;
  accountStatus: AccountStatus;
  password?: string;
  signedUpWith?: "EMAIL" | "GOOGLE" | "APPLE";
  username?: string;
  firstName?: string;
  email?: string;
  phoneNumber?: string;
}

export interface IUsernameCanonical {
  _id: mongoose.Types.ObjectId;
  usernameCanonical?: string;
}

const REQUIRED_FIELDS = [
  "_id",
  "accountStatus",
  "password",
  "signedUpWith",
  "username",
  "firstName",
  "email",
  "phoneNumber",
];

const ACCOUNT_STATUS_MAP: Record<string, TransInfo> = {
  DEACTIVATED: MESSAGES_REGISTRY.AUTH.ACCOUNT_DEACTIVATED,
  SUSPENDED: MESSAGES_REGISTRY.AUTH.ACCOUNT_SUSPENDED,
  BANNED: MESSAGES_REGISTRY.AUTH.ACCOUNT_BANNED,
};

/**
 * Builds user account summary payload for response objects.
 */
const buildUserPayload = (user: IAccountCheckProjection) => ({
  accountStatus: user.accountStatus,
  userId: user._id,
  username: user.username,
  firstName: user.firstName,
  email: user.email,
  phone: user.phoneNumber,
});

/**
 * Validates identity parameter availability and security flags across email, phone, and username attributes.
 */
export const executeAccountCheck = async (
  input: CheckInput,
): Promise<CheckResult> => {
  const { type, identifier, purpose = "REGISTRATION" } = input;

  if (!identifier) {
    const errorMapping =
      type === "EMAIL"
        ? MESSAGES_REGISTRY.AUTH.EMAIL_REQUIRED
        : type === "PHONE"
          ? MESSAGES_REGISTRY.AUTH.PHONE_REQUIRED
          : MESSAGES_REGISTRY.AUTH.USERNAME_REQUIRED;

    return {
      status: "MISSING_IDENTIFIER",
      ...errorMapping,
    };
  }

  const existingUser = await fetchSingleUser<IAccountCheckProjection>({
    identifier,
    select: REQUIRED_FIELDS,
    flags: { identifierType: type, skipFilter: true },
  });

  // Helper handling third-party provider check restrictions
  const checkThirdPartyRestriction = (
    user: IAccountCheckProjection,
  ): CheckResult | null => {
    if (
      !user.password &&
      (user.signedUpWith === "GOOGLE" || user.signedUpWith === "APPLE")
    ) {
      const provider = user.signedUpWith === "GOOGLE" ? "Google" : "Apple";
      return {
        status: "THIRD_PARTY_RESTRICTION",
        transInfo: MESSAGES_REGISTRY.AUTH.NOT_SIGNED_UP_WITH_EMAIL(provider),
        isExisting: true,
        signedUpWith: user.signedUpWith,
        payload: buildUserPayload(user),
      };
    }
    return null;
  };

  // ── PHONE CHECK PIPELINE ──────────────────────────────────────────────────
  if (type === "PHONE") {
    if (purpose === "REGISTRATION") {
      return {
        status: "SUCCESS",
        transInfo: existingUser
          ? MESSAGES_REGISTRY.AUTH.PHONE_REGISTERED
          : MESSAGES_REGISTRY.AUTH.PHONE_AVAILABLE,
        isExisting: Boolean(existingUser),
      };
    }

    if (!existingUser) {
      return {
        status: "NOT_FOUND",
        transInfo: MESSAGES_REGISTRY.AUTH.PHONE_NOT_FOUND,
      };
    }

    const restriction = checkThirdPartyRestriction(existingUser);
    if (restriction) return restriction;

    const transMsg =
      existingUser.accountStatus === "ACTIVE" ||
      existingUser.accountStatus === "INACTIVE"
        ? MESSAGES_REGISTRY.AUTH.PHONE_REGISTERED
        : ACCOUNT_STATUS_MAP[existingUser.accountStatus];

    return {
      status: "SUCCESS",
      transInfo: transMsg,
      isExisting: true,
      signedUpWith: existingUser.signedUpWith || "EMAIL",
      payload: buildUserPayload(existingUser),
    };
  }

  // ── EMAIL CHECK PIPELINE ──────────────────────────────────────────────────
  if (type === "EMAIL") {
    if (purpose === "REGISTRATION") {
      return {
        status: "SUCCESS",
        transInfo: existingUser
          ? MESSAGES_REGISTRY.AUTH.EMAIL_ALREADY_REGISTERED
          : MESSAGES_REGISTRY.AUTH.EMAIL_AVAILABLE,
        isExisting: Boolean(existingUser),
      };
    }

    if (!existingUser) {
      return {
        status: "NOT_FOUND",
        transInfo: MESSAGES_REGISTRY.AUTH.EMAIL_NOT_FOUND,
      };
    }

    const restriction = checkThirdPartyRestriction(existingUser);
    if (restriction) return restriction;

    const transMsg =
      existingUser.accountStatus === "ACTIVE" ||
      existingUser.accountStatus === "INACTIVE"
        ? MESSAGES_REGISTRY.AUTH.EMAIL_ALREADY_REGISTERED
        : ACCOUNT_STATUS_MAP[existingUser.accountStatus];

    return {
      status: "SUCCESS",
      transInfo: transMsg,
      isExisting: true,
      signedUpWith: existingUser.signedUpWith || "EMAIL",
      payload: buildUserPayload(existingUser),
    };
  }

  // ── USERNAME CHECK PIPELINE ───────────────────────────────────────────────
  if (purpose === "LOGIN") {
    if (!existingUser) {
      return {
        status: "NOT_FOUND",
        transInfo: MESSAGES_REGISTRY.AUTH.USERNAME_NOT_FOUND,
      };
    }

    const restriction = checkThirdPartyRestriction(existingUser);
    if (restriction) return restriction;

    const transMsg =
      existingUser.accountStatus === "ACTIVE"
        ? MESSAGES_REGISTRY.AUTH.USERNAME_ACTIVE
        : existingUser.accountStatus === "INACTIVE"
          ? MESSAGES_REGISTRY.AUTH.USERNAME_INACTIVE
          : ACCOUNT_STATUS_MAP[existingUser.accountStatus];

    return {
      status: "SUCCESS",
      transInfo: transMsg,
      isExisting: true,
      signedUpWith: existingUser.signedUpWith || "EMAIL",
      payload: buildUserPayload(existingUser),
    };
  }

  // Username Registration Check (Generate suggestions if username is taken)
  if (!existingUser) {
    return {
      status: "SUCCESS",
      isExisting: false,
      transInfo: MESSAGES_REGISTRY.AUTH.USERNAME_AVAILABLE,
      payload: null,
    };
  }

  const formattedValue = normalizeValue(identifier);
  const baseCanonical = transformToASCII(formattedValue);
  const suggestions: string[] = [];
  const suggestionRegex = new RegExp(`^${baseCanonical}\\d*$`, "i");

  const takenDocs = await fetchManyUsers<IUsernameCanonical>({
    query: { usernameCanonical: suggestionRegex },
    select: ["usernameCanonical"],
    limit: 100,
    flags: { skipFilter: true },
  });

  const takenSet = new Set(
    takenDocs
      .map((u) => u.usernameCanonical)
      .filter((name): name is string => typeof name === "string")
      .map((name) => name.toLowerCase()),
  );

  let counter = 1;
  while (suggestions.length < 5) {
    const candidateSuffix = `${counter}`;
    const candidateCanonical = `${baseCanonical}${candidateSuffix}`;
    if (!takenSet.has(candidateCanonical.toLowerCase())) {
      const displayCandidate = `${formattedValue}${candidateSuffix}`;
      suggestions.push(displayCandidate);
    }
    counter++;
    if (counter > 100) break;
  }

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.USERNAME_TAKEN,
    isExisting: true,
    suggestions,
    payload: null,
  };
};

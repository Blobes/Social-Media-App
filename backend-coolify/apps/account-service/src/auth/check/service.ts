import { AccountStatus, IUserDocument, UserModel } from "@repo/database";
import {
  MESSAGES_REGISTRY,
  normalizeValue,
  transformToASCII,
  TransInfo,
} from "@repo/shared";

export type CheckType = "EMAIL" | "PHONE" | "USERNAME";
export type CheckPurpose = "REGISTRATION" | "LOGIN";

export interface CheckInput {
  type: CheckType;
  identifier: string;
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
    userId: any;
    username?: string;
    firstName?: string;
    email?: string;
    phone?: string;
  } | null;
}

/**
 * Validates identity parameter availability and security flags across email, phone, and username attributes.
 */
export const executeAccountCheck = async (
  input: CheckInput,
): Promise<CheckResult> => {
  const { type, identifier, purpose = "REGISTRATION" } = input;

  if (!identifier) {
    let errorMapping;
    if (type === "EMAIL") {
      errorMapping = MESSAGES_REGISTRY.AUTH.EMAIL_REQUIRED;
    } else if (type === "PHONE") {
      errorMapping = MESSAGES_REGISTRY.AUTH.PHONE_REQUIRED;
    } else {
      errorMapping = MESSAGES_REGISTRY.AUTH.USERNAME_REQUIRED;
    }
    return {
      status: "MISSING_IDENTIFIER",
      ...errorMapping,
    };
  }

  // if (type === "EMAIL") {
  //   query = { email: formattedValue.toLowerCase() };
  // } else if (type === "PHONE") {
  //   query = { phoneNumber: formattedValue.replace(/\D/g, "") };
  // } else {
  //   query = { usernameCanonical: transformToASCII(formattedValue) };
  // }
  // const existingUser = await UserModel.findOne(query).setOptions({
  //   skipFilter: true,
  // });

  const formattedValue = normalizeValue(identifier);
  let existingUser: IUserDocument | null = null;

  // Utilize the custom static helpers to check blind index hashes underneath
  if (type === "EMAIL") {
    existingUser = await UserModel.findByEmail(formattedValue.toLowerCase());
  } else if (type === "PHONE") {
    existingUser = await UserModel.findByPhone(
      formattedValue.replace(/\D/g, ""),
    );
  } else {
    const query = { usernameCanonical: transformToASCII(formattedValue) };
    existingUser = await UserModel.findOne(query).setOptions({
      skipFilter: true,
    });
  }

  const accountStatusMap = {
    DEACTIVATED: MESSAGES_REGISTRY.AUTH.ACCOUNT_DEACTIVATED,
    SUSPENDED: MESSAGES_REGISTRY.AUTH.ACCOUNT_SUSPENDED,
    BANNED: MESSAGES_REGISTRY.AUTH.ACCOUNT_BANNED,
  };

  // ── PHONE CHECK PIPELINE ──────────────────────────────────────────────────
  if (type === "PHONE") {
    if (purpose === "REGISTRATION") {
      if (existingUser) {
        return {
          status: "SUCCESS",
          transInfo: MESSAGES_REGISTRY.AUTH.PHONE_REGISTERED,
          isExisting: true,
        };
      }
      return {
        status: "SUCCESS",
        transInfo: MESSAGES_REGISTRY.AUTH.PHONE_AVAILABLE,
        isExisting: false,
      };
    }

    if (!existingUser) {
      return {
        status: "NOT_FOUND",
        transInfo: MESSAGES_REGISTRY.AUTH.PHONE_NOT_FOUND,
      };
    }

    if (
      !existingUser.password &&
      (existingUser.signedUpWith === "GOOGLE" ||
        existingUser.signedUpWith === "APPLE")
    ) {
      const provider =
        existingUser.signedUpWith === "GOOGLE" ? "Google" : "Apple";
      return {
        status: "THIRD_PARTY_RESTRICTION",
        transInfo: MESSAGES_REGISTRY.AUTH.NOT_SIGNED_UP_WITH_EMAIL(provider),
        isExisting: true,
        signedUpWith: existingUser.signedUpWith,
        payload: {
          accountStatus: existingUser.accountStatus,
          userId: existingUser._id,
          username: existingUser.username,
          firstName: existingUser.firstName,
          email: existingUser.email,
          phone: existingUser.phoneNumber,
        },
      };
    }

    const transMsg =
      existingUser.accountStatus === "ACTIVE" ||
      existingUser.accountStatus === "INACTIVE"
        ? MESSAGES_REGISTRY.AUTH.PHONE_REGISTERED
        : accountStatusMap[existingUser.accountStatus];

    return {
      status: "SUCCESS",
      transInfo: transMsg,
      isExisting: true,
      signedUpWith: existingUser.signedUpWith || "EMAIL",
      payload: {
        accountStatus: existingUser.accountStatus,
        userId: existingUser._id,
        username: existingUser.username,
        firstName: existingUser.firstName,
        email: existingUser.email,
        phone: existingUser.phoneNumber,
      },
    };
  }

  // ── EMAIL CHECK PIPELINE ──────────────────────────────────────────────────
  if (type === "EMAIL") {
    if (purpose === "REGISTRATION") {
      if (existingUser) {
        return {
          status: "SUCCESS",
          transInfo: MESSAGES_REGISTRY.AUTH.EMAIL_ALREADY_REGISTERED,
          isExisting: true,
        };
      }
      return {
        status: "SUCCESS",
        transInfo: MESSAGES_REGISTRY.AUTH.EMAIL_AVAILABLE,
        isExisting: false,
      };
    }

    if (!existingUser) {
      return {
        status: "NOT_FOUND",
        transInfo: MESSAGES_REGISTRY.AUTH.EMAIL_NOT_FOUND,
      };
    }

    if (
      !existingUser.password &&
      (existingUser.signedUpWith === "GOOGLE" ||
        existingUser.signedUpWith === "APPLE")
    ) {
      const provider =
        existingUser.signedUpWith === "GOOGLE" ? "Google" : "Apple";
      return {
        status: "THIRD_PARTY_RESTRICTION",
        transInfo: MESSAGES_REGISTRY.AUTH.NOT_SIGNED_UP_WITH_EMAIL(provider),
        isExisting: true,
        signedUpWith: existingUser.signedUpWith,
        payload: {
          accountStatus: existingUser.accountStatus,
          userId: existingUser._id,
          username: existingUser.username,
          firstName: existingUser.firstName,
          email: existingUser.email,
          phone: existingUser.phoneNumber,
        },
      };
    }

    const transMsg =
      existingUser.accountStatus === "ACTIVE" ||
      existingUser.accountStatus === "INACTIVE"
        ? MESSAGES_REGISTRY.AUTH.EMAIL_ALREADY_REGISTERED
        : accountStatusMap[existingUser.accountStatus];

    return {
      status: "SUCCESS",
      transInfo: transMsg,
      isExisting: true,
      signedUpWith: existingUser.signedUpWith || "EMAIL",
      payload: {
        accountStatus: existingUser.accountStatus,
        userId: existingUser._id,
        username: existingUser.username,
        firstName: existingUser.firstName,
        email: existingUser.email,
        phone: existingUser.phoneNumber,
      },
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
    if (
      !existingUser.password &&
      (existingUser.signedUpWith === "GOOGLE" ||
        existingUser.signedUpWith === "APPLE")
    ) {
      const provider =
        existingUser.signedUpWith === "GOOGLE" ? "Google" : "Apple";
      return {
        status: "THIRD_PARTY_RESTRICTION",
        transInfo: MESSAGES_REGISTRY.AUTH.NOT_SIGNED_UP_WITH_EMAIL(provider),
        isExisting: true,
        signedUpWith: existingUser.signedUpWith,
        payload: {
          accountStatus: existingUser.accountStatus,
          userId: existingUser._id,
          username: existingUser.username,
          firstName: existingUser.firstName,
          email: existingUser.email,
          phone: existingUser.phoneNumber,
        },
      };
    }

    const transMsg =
      existingUser.accountStatus === "ACTIVE"
        ? MESSAGES_REGISTRY.AUTH.USERNAME_ACTIVE
        : existingUser.accountStatus === "INACTIVE"
          ? MESSAGES_REGISTRY.AUTH.USERNAME_INACTIVE
          : accountStatusMap[existingUser.accountStatus];

    return {
      status: "SUCCESS",
      transInfo: transMsg,
      isExisting: true,
      signedUpWith: existingUser.signedUpWith || "EMAIL",
      payload: {
        accountStatus: existingUser.accountStatus,
        userId: existingUser._id,
        username: existingUser.username,
        firstName: existingUser.firstName,
        email: existingUser.email,
        phone: existingUser.phoneNumber,
      },
    };
  }

  if (!existingUser) {
    return {
      status: "SUCCESS",
      isExisting: false,
      transInfo: MESSAGES_REGISTRY.AUTH.USERNAME_AVAILABLE,
      payload: null,
    };
  }

  const baseCanonical = transformToASCII(formattedValue);
  const suggestions: string[] = [];
  const suggestionRegex = new RegExp(`^${baseCanonical}\\d*$`, "i");

  const taken = await UserModel.find({ usernameCanonical: suggestionRegex })
    .select("usernameCanonical -_id")
    .setOptions({ skipFilter: true })
    .lean();

  const takenSet = new Set(
    taken
      .map((u) => u.usernameCanonical)
      .filter((name): name is string => typeof name === "string")
      .map((name) => name.toLowerCase()),
  );

  let counter = 1;
  while (suggestions.length < 5) {
    const candidateSuffix = `${counter}`;
    // Build canonical match string configuration layout
    const candidateCanonical = `${baseCanonical}${candidateSuffix}`;
    if (!takenSet.has(candidateCanonical.toLowerCase())) {
      // Return human-readable text configuration layouts for display suggestion lines
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

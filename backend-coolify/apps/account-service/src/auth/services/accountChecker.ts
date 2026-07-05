import { UserModel } from "@repo/database";
import { MESSAGES_REGISTRY, TransInfo } from "@repo/shared";

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
    accountStatus: "ACTIVE" | "DEACTIVATED";
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

  let query: any = {};
  const formattedValue = identifier.trim();

  if (type === "EMAIL") {
    query = { email: formattedValue.toLowerCase() };
  } else if (type === "PHONE") {
    query = { phoneNumber: formattedValue.replace(/\D/g, "") };
  } else {
    query = { username: { $regex: new RegExp(`^${formattedValue}$`, "i") } };
  }

  const existingUser = await UserModel.findOne(query).setOptions({
    skipFilter: true,
  });

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
          accountStatus: !existingUser.isDeactivated ? "ACTIVE" : "DEACTIVATED",
          userId: existingUser._id,
          username: existingUser.username,
          firstName: existingUser.firstName,
          email: existingUser.email,
          phone: existingUser.phoneNumber,
        },
      };
    }

    const matchedMapping = !existingUser.isDeactivated
      ? MESSAGES_REGISTRY.AUTH.PHONE_REGISTERED
      : MESSAGES_REGISTRY.AUTH.ACCOUNT_DEACTIVATED;

    return {
      status: "SUCCESS",
      transInfo: matchedMapping,
      isExisting: true,
      signedUpWith: existingUser.signedUpWith || "EMAIL",
      payload: {
        accountStatus: !existingUser.isDeactivated ? "ACTIVE" : "DEACTIVATED",
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
          accountStatus: !existingUser.isDeactivated ? "ACTIVE" : "DEACTIVATED",
          userId: existingUser._id,
          username: existingUser.username,
          firstName: existingUser.firstName,
          email: existingUser.email,
          phone: existingUser.phoneNumber,
        },
      };
    }

    const matchedMapping = !existingUser.isDeactivated
      ? MESSAGES_REGISTRY.AUTH.EMAIL_ALREADY_REGISTERED
      : MESSAGES_REGISTRY.AUTH.ACCOUNT_DEACTIVATED;

    return {
      status: "SUCCESS",
      transInfo: matchedMapping,
      isExisting: true,
      signedUpWith: existingUser.signedUpWith || "EMAIL",
      payload: {
        accountStatus: !existingUser.isDeactivated ? "ACTIVE" : "DEACTIVATED",
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
          accountStatus: !existingUser.isDeactivated ? "ACTIVE" : "DEACTIVATED",
          userId: existingUser._id,
          username: existingUser.username,
          firstName: existingUser.firstName,
          email: existingUser.email,
          phone: existingUser.phoneNumber,
        },
      };
    }

    const matchedMapping = !existingUser.isDeactivated
      ? MESSAGES_REGISTRY.AUTH.USERNAME_ACTIVE
      : MESSAGES_REGISTRY.AUTH.ACCOUNT_DEACTIVATED;

    return {
      status: "SUCCESS",
      transInfo: matchedMapping,
      isExisting: true,
      signedUpWith: existingUser.signedUpWith || "EMAIL",
      payload: {
        accountStatus: !existingUser.isDeactivated ? "ACTIVE" : "DEACTIVATED",
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

  const suggestions: string[] = [];
  const regex = new RegExp(`^${formattedValue}\\d*$`, "i");

  const taken = await UserModel.find({ username: regex })
    .select("username -_id")
    .setOptions({ skipFilter: true })
    .lean();

  const takenSet = new Set(
    taken
      .map((u) => u.username)
      .filter((name): name is string => typeof name === "string")
      .map((name) => name.toLowerCase()),
  );

  let counter = 1;
  while (suggestions.length < 5) {
    const candidate = `${formattedValue}${counter}`;
    if (!takenSet.has(candidate.toLowerCase())) suggestions.push(candidate);
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

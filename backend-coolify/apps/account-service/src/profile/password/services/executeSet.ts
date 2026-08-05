import { encryptPass, verifyEncryptedPass } from "@/auth/helpers/encrypt";
import {
  cleanDeviceSessions,
  TransInfo,
  MESSAGES_REGISTRY,
  normalizeValue,
  getAccountStatusMsg,
  fetchSingleUser,
} from "@repo/shared";

export type PasswordPurpose =
  | "CREATE_PASSWORD"
  | "CHANGE_PASSWORD"
  | "PASSWORD_RESET";

interface IUpdatePasswordInput {
  userId?: string;
  jwtDeviceId?: string;
  identifier?: string;
  purpose: PasswordPurpose;
  newPassword: string;
  currentPassword?: string;
}

interface IUpdatePasswordResult {
  status:
    | "SUCCESS"
    | "NOT_FOUND"
    | "PASSWORD_ALREADY_EXISTS"
    | "NO_PASSWORD_SET"
    | "INCORRECT_CURRENT_PASSWORD"
    | "PASSWORD_REUSE_FORBIDDEN"
    | "MISSING_IDENTIFIER"
    | "RESTRICTION";
  transInfo: TransInfo;
  payload?: {
    loggedOut: boolean;
  };
}

/**
 * Handles password setting and updating strategies, including reset workflows, state verification, and security session terminations.
 */
export const executePasswordUpdate = async (
  input: IUpdatePasswordInput,
): Promise<IUpdatePasswordResult> => {
  const {
    userId,
    jwtDeviceId,
    identifier,
    purpose,
    newPassword,
    currentPassword,
  } = input;

  let user = null;

  // ── STRATEGY: PASSWORD RESET (NO JWT / UNAUTHENTICATED) ─────────────────
  if (purpose === "PASSWORD_RESET") {
    if (!identifier) {
      return {
        status: "MISSING_IDENTIFIER",
        transInfo: MESSAGES_REGISTRY.AUTH.EMAIL_OR_PHONE_REQUIRED,
      };
    }

    // user = isEmail
    //   ? await UserModel.findByEmail({
    //       email: formattedValue.toLowerCase(),
    //       options: { skipFilter: true },
    //     }).select("+password")
    //   : await UserModel.findByPhone({
    //       phoneNumber: formattedValue.replace(/\D/g, ""),
    //       options: { skipFilter: true },
    //     }).select("+password");
    const formattedValue = normalizeValue(identifier);
    const isEmail = formattedValue.includes("@");

    user = await fetchSingleUser({
      identifier: isEmail
        ? formattedValue.toLowerCase()
        : formattedValue.replace(/\D/g, ""),
      select: ["+password"],
      flags: {
        lean: false,
        identifierType: isEmail ? "EMAIL" : "PHONE",
        skipFilter: true,
      },
    });

    if (!user) {
      return {
        status: "NOT_FOUND",
        transInfo: isEmail
          ? MESSAGES_REGISTRY.AUTH.EMAIL_NOT_FOUND
          : MESSAGES_REGISTRY.AUTH.PHONE_NOT_FOUND,
      };
    }

    const accountStatus = user.accountStatus;
    if (
      accountStatus === "DEACTIVATED" ||
      accountStatus === "SUSPENDED" ||
      accountStatus === "BANNED"
    ) {
      const restrictionMsg = getAccountStatusMsg(accountStatus, "RESTRICTED");
      return {
        status: "RESTRICTION",
        transInfo: restrictionMsg.transInfo,
      };
    }

    if (user.password) {
      const isSamePassword = await verifyEncryptedPass(
        newPassword,
        user.password,
      );
      if (isSamePassword) {
        return {
          status: "PASSWORD_REUSE_FORBIDDEN",
          transInfo: MESSAGES_REGISTRY.AUTH.PASSWORD_REUSE_FORBIDDEN,
        };
      }
    }
  } else {
    // ── AUTHENTICATED PATH (CREATE_PASSWORD / CHANGE_PASSWORD) ───────────
    if (!userId) {
      return {
        status: "NOT_FOUND",
        transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
      };
    }

    // user = await UserModel.findById(userId).select("+password");
    user = await fetchSingleUser({
      identifier: userId,
      select: ["+password"],
      flags: {
        lean: false,
        skipFilter: true,
      },
    });

    if (!user) {
      return {
        status: "NOT_FOUND",
        transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
      };
    }

    // ── STRATEGY: CREATE PASSWORD ──────────────────────────────────────────────
    if (purpose === "CREATE_PASSWORD") {
      if (user.password) {
        return {
          status: "PASSWORD_ALREADY_EXISTS",
          transInfo: MESSAGES_REGISTRY.AUTH.PASSWORD_ALREADY_EXISTS,
        };
      }
    }

    // ── STRATEGY: CHANGE PASSWORD ──────────────────────────────────────────────
    if (purpose === "CHANGE_PASSWORD") {
      if (!user.password) {
        return {
          status: "NO_PASSWORD_SET",
          transInfo: MESSAGES_REGISTRY.AUTH.NO_PASSWORD_SET,
        };
      }

      if (!currentPassword) {
        return {
          status: "INCORRECT_CURRENT_PASSWORD",
          transInfo: MESSAGES_REGISTRY.AUTH.CURRENT_PASSWORD_REQUIRED,
        };
      }

      const isMatch = await verifyEncryptedPass(currentPassword, user.password);
      if (!isMatch) {
        return {
          status: "INCORRECT_CURRENT_PASSWORD",
          transInfo: MESSAGES_REGISTRY.AUTH.INCORRECT_CURRENT_PASSWORD,
        };
      }

      const isSamePassword = await verifyEncryptedPass(
        newPassword,
        user.password,
      );
      if (isSamePassword) {
        return {
          status: "PASSWORD_REUSE_FORBIDDEN",
          transInfo: MESSAGES_REGISTRY.AUTH.PASSWORD_REUSE_FORBIDDEN,
        };
      }
    }
  }

  // Cryptographic mutation and update operations
  user.password = await encryptPass(newPassword);
  await user.save();

  // Nuke secondary environments to isolate security contexts
  const wasSessionPreserved = await cleanDeviceSessions(
    user._id.toString(),
    undefined,
    {
      clearAll: true,
      preservePrimary: true,
      primaryDeviceId: user.primaryDeviceId?.toString(),
    },
  );

  const isCurrentDevicePrimary =
    jwtDeviceId && jwtDeviceId === user.primaryDeviceId?.toString();
  const shouldLogout = !isCurrentDevicePrimary || !wasSessionPreserved;

  return {
    status: "SUCCESS",
    transInfo:
      purpose === "PASSWORD_RESET" || shouldLogout
        ? MESSAGES_REGISTRY.AUTH.PASSWORD_CHANGED_SESSIONS_ENDED
        : MESSAGES_REGISTRY.AUTH.PASSWORD_CHANGED_SUCCESSFULLY,
    payload: { loggedOut: shouldLogout },
  };
};

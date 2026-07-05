import { UserModel } from "@repo/database";
import bcrypt from "bcrypt";
import {
  CACHE_KEYS,
  invalidateCache,
  cleanDeviceSessions,
  TransInfo,
  MESSAGES_REGISTRY,
} from "@repo/shared";

export type PasswordPurpose = "CREATE_PASSWORD" | "CHANGE_PASSWORD";

interface IUpdatePasswordInput {
  userId: string;
  jwtDeviceId: string;
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
    | "PASSWORD_REUSE_FORBIDDEN";
  transInfo: TransInfo;
  payload?: {
    loggedOut: boolean;
  };
}

/**
 * Handles password setting and updating strategies, including state verification and security session terminations.
 */
export const executePasswordUpdate = async (
  input: IUpdatePasswordInput,
): Promise<IUpdatePasswordResult> => {
  const { userId, jwtDeviceId, purpose, newPassword, currentPassword } = input;

  const user = await UserModel.findById(userId).select("+password");
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

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return {
        status: "INCORRECT_CURRENT_PASSWORD",
        transInfo: MESSAGES_REGISTRY.AUTH.INCORRECT_CURRENT_PASSWORD,
      };
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return {
        status: "PASSWORD_REUSE_FORBIDDEN",
        transInfo: MESSAGES_REGISTRY.AUTH.PASSWORD_REUSE_FORBIDDEN,
      };
    }
  }

  // Cryptographic mutation and update operations
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  // Nuke secondary environments to isolate security contexts
  const wasSessionPreserved = await cleanDeviceSessions(userId, undefined, {
    clearAll: true,
    preservePrimary: true,
    primaryDeviceId: user.primaryDeviceId?.toString(),
  });

  await invalidateCache(CACHE_KEYS.USER_PROFILE(userId));

  const isCurrentDevicePrimary =
    jwtDeviceId === user.primaryDeviceId?.toString();
  const shouldLogout = !isCurrentDevicePrimary || !wasSessionPreserved;

  return {
    status: "SUCCESS",
    transInfo: shouldLogout
      ? MESSAGES_REGISTRY.AUTH.PASSWORD_CHANGED_SESSIONS_ENDED
      : MESSAGES_REGISTRY.AUTH.PASSWORD_CHANGED_SUCCESSFULLY,
    payload: { loggedOut: shouldLogout },
  };
};

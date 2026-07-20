import { UserModel } from "@repo/database";
import {
  hashCode,
  CACHE_KEYS,
  invalidatePattern,
  cleanDeviceSessions,
  TransInfo,
  MESSAGES_REGISTRY,
} from "@repo/shared";

interface IEmailChangeInput {
  userId: string;
  currentDeviceId?: string;
  code: string;
}

interface IEmailChangeResult {
  status:
    | "SUCCESS"
    | "NOT_FOUND"
    | "NO_PENDING_CHANGE"
    | "NO_ACTIVE_PROCESS"
    | "EXPIRED"
    | "INVALID_CODE";
  transInfo: TransInfo;
  payload?: {
    loggedOut: boolean;
  };
}

/**
 * Validates verification codes, updates active email state, and destroys secondary device sessions.
 */
export const executeEmailChange = async (
  input: IEmailChangeInput,
): Promise<IEmailChangeResult> => {
  const { userId, currentDeviceId, code } = input;

  const user = await UserModel.findById(userId);
  if (!user) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  if (!user.pendingEmail) {
    return {
      status: "NO_PENDING_CHANGE",
      transInfo: MESSAGES_REGISTRY.AUTH.NO_PENDING_EMAIL_CHANGE,
    };
  }

  if (!user.otpCode || !user.otpCodeExpiresAt) {
    return {
      status: "NO_ACTIVE_PROCESS",
      transInfo: MESSAGES_REGISTRY.AUTH.NO_ACTIVE_PROCESS,
    };
  }

  if (Date.now() > user.otpCodeExpiresAt.getTime()) {
    return {
      status: "EXPIRED",
      transInfo: MESSAGES_REGISTRY.AUTH.EXPIRED,
    };
  }

  if (hashCode(code) !== user.otpCode) {
    return {
      status: "INVALID_CODE",
      transInfo: MESSAGES_REGISTRY.AUTH.INVALID_OTP_CODE,
    };
  }

  // Finalize identity data points and clear registration markers
  user.email = user.pendingEmail;
  user.pendingEmail = null;
  user.isEmailVerified = true;
  user.lastEmailChangeAt = new Date();
  user.lastEmailCodeSentAt = null;
  user.otpCode = null;
  user.otpCodeExpiresAt = null;

  await user.save();

  // Nuke unauthorized endpoints to prevent session hijacking
  await cleanDeviceSessions(String(userId), undefined, {
    clearAll: true,
    preservePrimary: true,
    primaryDeviceId: user.primaryDeviceId?.toString(),
  });

  const isCurrentDevicePrimary =
    currentDeviceId === user.primaryDeviceId?.toString();

  await invalidatePattern(CACHE_KEYS.WILDCARD_USER_ALL(String(user._id)));

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.EMAIL_UPDATED_SESSIONS_ENDED,
    payload: { loggedOut: !isCurrentDevicePrimary },
  };
};

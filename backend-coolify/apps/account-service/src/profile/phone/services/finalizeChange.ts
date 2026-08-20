import {
  hashCode,
  cleanDeviceSessions,
  TransInfo,
  MESSAGES_REGISTRY,
  fetchSingleUser,
} from "@repo/shared";

interface IPhoneChangeInput {
  userId: string;
  currentDeviceId?: string;
  code: string;
}

interface IPhoneChnageResult {
  status: "SUCCESS" | "NOT_FOUND" | "EXPIRED" | "INVALID_CODE";
  transInfo: TransInfo;
  payload?: {
    phoneNumber: string;
    loggedOut: boolean;
  };
}

/**
 * Validates incoming telephone verification codes, overrides verified numbers, and flushes unauthorized sessions.
 */
export const executePhoneChange = async (
  input: IPhoneChangeInput,
): Promise<IPhoneChnageResult> => {
  const { userId, currentDeviceId, code } = input;

  const user = await fetchSingleUser({
    identifier: userId,
    flags: {
      lean: false,
    },
  });
  if (!user || !user.pendingPhoneNumber) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.NO_PENDING_PHONE_CHANGE,
    };
  }

  const isCodeValid = hashCode(code) === user.otpCode;
  const isExpired = user.otpCodeExpiresAt
    ? new Date() > user.otpCodeExpiresAt
    : true;

  if (!isCodeValid || isExpired) {
    return {
      status: isExpired ? "EXPIRED" : "INVALID_CODE",
      transInfo: isExpired
        ? MESSAGES_REGISTRY.AUTH.CODE_EXPIRED
        : MESSAGES_REGISTRY.AUTH.INVALID_OTP_CODE,
    };
  }

  // Mutate profile configurations and strip temporary tracking markers
  user.phoneNumber = user.pendingPhoneNumber;
  user.pendingPhoneNumber = null;
  user.otpCode = null;
  user.otpCodeExpiresAt = null;
  user.lastPhoneChangeAt = new Date();

  await user.save();

  // Nuke secondary device vectors to maintain operational posture integrity
  await cleanDeviceSessions(String(userId), undefined, {
    clearAll: true,
    preservePrimary: true,
    primaryDeviceId: user.primaryDeviceId?.toString(),
  });

  const isCurrentDevicePrimary =
    currentDeviceId === user.primaryDeviceId?.toString();

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.PHONE_VERIFIED_SESSIONS_ENDED,
    payload: {
      phoneNumber: user.phoneNumber,
      loggedOut: !isCurrentDevicePrimary,
    },
  };
};

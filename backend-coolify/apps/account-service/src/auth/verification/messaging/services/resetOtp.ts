import { MESSAGES_REGISTRY, TransInfo, fetchSingleUser } from "@repo/shared";

export interface IResetOtpInput {
  recipient: string;
}

interface IResetOtpResult {
  status: "SUCCESS" | "USER_NOT_FOUND";
  transInfo?: TransInfo;
}

/**
 * Resets OTP fields and delivery rate-limiting timestamps for a specific user.
 */
export const executeOtpReset = async (
  input: IResetOtpInput,
): Promise<IResetOtpResult> => {
  const { recipient } = input;

  const user = await fetchSingleUser({
    identifier: recipient,
    flags: { lean: false, skipFilter: true },
  });

  if (!user) {
    return {
      status: "USER_NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  user.otpCode = null;
  user.otpCodeExpiresAt = null;
  user.lastEmailOtpSentAt = null;
  user.lastPhoneOtpSentAt = null;

  await user.save();

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.OTP_RESET_SUCCESS,
  };
};

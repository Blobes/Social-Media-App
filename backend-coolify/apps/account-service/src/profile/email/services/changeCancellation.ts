import { TransInfo, MESSAGES_REGISTRY, fetchSingleUser } from "@repo/shared";

interface ICancelEmailChangeInput {
  userId: string;
}

interface ICancelEmailChangeResult {
  status: "SUCCESS" | "NOT_FOUND" | "NO_PENDING_CHANGE";
  transInfo: TransInfo;
}

/**
 * Resets verification states and purges unverified pending email change sequences.
 */
export const executeCancelEmailChange = async (
  input: ICancelEmailChangeInput,
): Promise<ICancelEmailChangeResult> => {
  const { userId } = input;

  //  const user = await UserModel.findById(userId);
  const user = await fetchSingleUser({
    identifier: userId,
    flags: { lean: false },
  });

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

  // Purge staging properties and restore active production parameters
  user.pendingEmail = null;
  user.otpCode = null;
  user.otpCodeExpiresAt = null;
  user.lastEmailOtpSentAt = null;
  user.isEmailVerified = true;

  await user.save();

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.EMAIL_CHANGE_CANCELLED,
  };
};

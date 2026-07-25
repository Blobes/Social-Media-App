import { DeviceModel, IUserDocument, UserModel } from "@repo/database";
import {
  CACHE_KEYS,
  ensurePrimaryDevice,
  hashCode,
  invalidatePattern,
  setOtpChannel,
  VerificationPurpose,
  OtpType,
  MESSAGES_REGISTRY,
  TransInfo,
} from "@repo/shared";
import { otpWorkflowRegistry } from "../helpers/otpWorkflow";

interface IVerifyOtpInput {
  recipient: string;
  code: string;
  purpose: VerificationPurpose;
  deviceToken: string;
  userAgent: string;
}

interface IVerifyOtpResult {
  status:
    | "SUCCESS"
    | "EXPIRED_CODE"
    | "INVALID_CODE"
    | "USER_NOT_FOUND"
    | "INVALID_CHANNEL";
  transInfo?: TransInfo;
  payload?: {
    purpose: VerificationPurpose;
    channel: OtpType;
    actionPayload: any;
  };
}

/**
 * Validates verification codes and executes contextual strategy transformations.
 */
export const executeOtpVerification = async (
  input: IVerifyOtpInput,
): Promise<IVerifyOtpResult> => {
  const { recipient, code, purpose, deviceToken, userAgent } = input;
  const normalized = recipient.toLowerCase().trim();
  const otpChannel = setOtpChannel(normalized);

  if (!otpChannel) {
    return {
      status: "INVALID_CHANNEL",
      transInfo: MESSAGES_REGISTRY.AUTH.INVALID_OTP_CHANNEL,
    };
    //  error.status = 400;
  }

  let user: IUserDocument | null = null;
  if (otpChannel === "EMAIL") {
    user = await UserModel.findByEmail({
      email: normalized,
      options: { skipFilter: true },
    });
  } else {
    user = await UserModel.findByPhone({
      phoneNumber: normalized,
      options: { skipFilter: true },
    });
  }

  if (!user) {
    return {
      status: "USER_NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  if (
    !user.otpCode ||
    !user.otpCodeExpiresAt ||
    Date.now() > user.otpCodeExpiresAt.getTime()
  ) {
    return {
      status: "EXPIRED_CODE",
      transInfo: MESSAGES_REGISTRY.AUTH.EXPIRED,
    };
  }

  if (hashCode(code) !== user.otpCode) {
    return {
      status: "INVALID_CODE",
      transInfo: MESSAGES_REGISTRY.AUTH.INVALID_OTP_CODE,
    };
  }

  console.log(
    `[OTP_TRACE] Purpose: ${purpose} | User: ${user._id} | Channel: ${otpChannel}`,
  );

  let actionPayload = null;
  const workflow = otpWorkflowRegistry[purpose];
  if (workflow) {
    actionPayload = await workflow(
      user,
      { userAgent, deviceToken, recipient: normalized, channel: otpChannel },
      "VERIFICATION",
    );
  }

  const currentDevice = deviceToken
    ? await DeviceModel.findOne({ userId: user._id, deviceToken }).select("_id")
    : null;
  await ensurePrimaryDevice(user, currentDevice?._id?.toString());

  user.otpCode = null;
  user.otpCodeExpiresAt = null;
  await user.save();

  await invalidatePattern(CACHE_KEYS.WILDCARD_USER_ALL(String(user._id)));

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.OTP_VERIFIED_SUCCESSFULLY,
    payload: { actionPayload, purpose, channel: otpChannel },
  };
};

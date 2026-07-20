import { emailDispatchTokens, phoneDispatchTokens } from "@/envVars";
import { UserModel } from "@repo/database";
import {
  dispatchEmailCode,
  dispatchWhatsAppCode,
  genVerificationCode,
  hashCode,
  OtpType,
  setOtpChannel,
  VerificationPurpose,
  MESSAGES_REGISTRY,
  TransInfo,
} from "@repo/shared";
import { otpWorkflowRegistry } from "../helpers/otpWorkflow";

interface ISendOtpInput {
  recipient: string;
  purpose: VerificationPurpose;
  userAgent: string;
  deviceToken: string;
}

interface ISendOtpResult {
  status: "SUCCESS";
  transInfo?: TransInfo;
  payload: {
    recipient: string;
    channel: OtpType;
    purpose: VerificationPurpose;
    actionPayload: any;
  };
}

const COOLDOWN_SECONDS = 60;

/**
 * Handles validation, state transitions, and dispatch mechanics for verification codes.
 */
export const executeOtpDispatch = async (
  input: ISendOtpInput,
): Promise<ISendOtpResult> => {
  const { recipient, purpose, userAgent, deviceToken } = input;
  const normalized = recipient.toLowerCase().trim();
  const channel = setOtpChannel(normalized);

  if (!channel) {
    const error = new Error(
      MESSAGES_REGISTRY.AUTH.INVALID_EMAIL.message,
    ) as any;
    error.status = 400;
    error.i18nKey = MESSAGES_REGISTRY.AUTH.INVALID_EMAIL.i18nKey;
    throw error;
  }

  const user = await UserModel.findOne(
    channel === "EMAIL" ? { email: normalized } : { phoneNumber: normalized },
  );

  if (!user) {
    const error = new Error(
      channel === "EMAIL"
        ? MESSAGES_REGISTRY.AUTH.EMAIL_NOT_FOUND.message
        : MESSAGES_REGISTRY.AUTH.PHONE_NOT_FOUND.message,
    ) as any;
    error.status = 404;
    error.i18nKey =
      channel === "EMAIL"
        ? MESSAGES_REGISTRY.AUTH.EMAIL_NOT_FOUND.message
        : MESSAGES_REGISTRY.AUTH.PHONE_NOT_FOUND.i18nKey;
    throw error;
  }

  console.log(
    `[OTP_TRACE] Purpose: ${purpose} | User: ${user._id} | Channel: ${channel}`,
  );

  let actionPayload = null;
  const workflow = otpWorkflowRegistry[purpose];
  if (workflow) {
    actionPayload = await workflow(
      user,
      { userAgent, deviceToken, recipient: normalized },
      "DISPATCH_REQUEST",
    );
  }

  const lastSentAt =
    channel === "EMAIL" ? user.lastEmailOtpSentAt : user.lastPhoneOtpSentAt;
  if (lastSentAt) {
    const elapsed = (Date.now() - lastSentAt.getTime()) / 1000;
    if (elapsed < COOLDOWN_SECONDS) {
      const secondsLeft = Math.ceil(COOLDOWN_SECONDS - elapsed);
      const error = new Error(
        MESSAGES_REGISTRY.AUTH.RATE_LIMIT_ACTIVE(secondsLeft).message,
      ) as any;
      error.status = 429;
      error.i18nKey =
        MESSAGES_REGISTRY.AUTH.RATE_LIMIT_ACTIVE(secondsLeft).i18nKey;
      throw error;
    }
  }

  const newCode = genVerificationCode();
  user.otpCode = hashCode(newCode);
  user.otpCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  if (channel === "EMAIL") {
    user.lastEmailOtpSentAt = new Date();
  } else {
    user.lastPhoneOtpSentAt = new Date();
  }

  await user.save();

  try {
    if (channel === "EMAIL") {
      await dispatchEmailCode(
        { to: normalized, code: newCode },
        emailDispatchTokens,
      );
    } else {
      await dispatchWhatsAppCode(
        { to: normalized, code: newCode },
        phoneDispatchTokens,
      );
    }
  } catch (dispatchError) {
    console.error(`[sendCode] ${channel} dispatch failed:`, dispatchError);
  }

  const msgTrans =
    channel === "EMAIL"
      ? MESSAGES_REGISTRY.AUTH.VERIFICATION_CODE_SENT_TO_EMAIL
      : MESSAGES_REGISTRY.AUTH.VERIFICATION_CODE_SENT_TO_PHONE;

  return {
    status: "SUCCESS",
    transInfo: msgTrans,
    payload: { actionPayload, recipient: normalized, channel, purpose },
  };
};

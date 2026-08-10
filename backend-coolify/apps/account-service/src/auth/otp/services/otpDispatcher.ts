import { emailDispatchTokens, phoneDispatchTokens } from "@/envVars";
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
  fetchSingleUser,
} from "@repo/shared";
import { otpWorkflowRegistry } from "../helpers/otpWorkflow";

interface ISendOtpInput {
  recipient: string;
  purpose: VerificationPurpose;
  userAgent: string;
  deviceToken: string;
}

interface ISendOtpResult {
  status: "SUCCESS" | "USER_NOT_FOUND" | "INVALID_CHANNEL" | "COOLDOWN_ACTIVE";
  transInfo?: TransInfo;
  payload?: {
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
    return {
      status: "INVALID_CHANNEL",
      transInfo: MESSAGES_REGISTRY.AUTH.INVALID_OTP_CHANNEL,
    };
  }

  const user = await fetchSingleUser({
    identifier: recipient,
    flags: { lean: false, skipFilter: true },
  });

  if (!user) {
    const transMsg =
      channel === "EMAIL"
        ? MESSAGES_REGISTRY.AUTH.EMAIL_NOT_FOUND
        : MESSAGES_REGISTRY.AUTH.PHONE_NOT_FOUND;
    return {
      status: "USER_NOT_FOUND",
      transInfo: transMsg,
    };
  }

  console.log(
    `[OTP_TRACE] Purpose: ${purpose} | User: ${user._id} | Channel: ${channel}`,
  );

  let actionPayload = null;
  const workflow = otpWorkflowRegistry[purpose];
  if (workflow) {
    actionPayload = await workflow(
      user,
      { userAgent, deviceToken, recipient: normalized, channel },
      "DISPATCH_REQUEST",
    );
  }

  const lastSentAt =
    channel === "EMAIL" ? user.lastEmailOtpSentAt : user.lastPhoneOtpSentAt;
  if (lastSentAt) {
    const elapsed = (Date.now() - lastSentAt.getTime()) / 1000;
    if (elapsed < COOLDOWN_SECONDS) {
      const secondsLeft = Math.ceil(COOLDOWN_SECONDS - elapsed);
      const transMsg = MESSAGES_REGISTRY.AUTH.RATE_LIMIT_ACTIVE(secondsLeft);
      return {
        status: "COOLDOWN_ACTIVE",
        transInfo: transMsg,
      };
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
        {
          recipient: { email: normalized, firstName: user.firstName },
          code: newCode,
        },
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

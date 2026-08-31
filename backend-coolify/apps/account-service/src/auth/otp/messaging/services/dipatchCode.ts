import { emailDispatchTokens, phoneDispatchTokens } from "@/envVars";
import {
  dispatchEmailCode,
  genVerificationCode,
  hashCode,
  MESSAGES_REGISTRY,
  TransInfo,
  fetchSingleUser,
  OtpMessageChannel,
  dispatchWhatsAppOtp,
  dispatchSmsOtp,
} from "@repo/shared";

interface ISendOtpInput {
  recipient: string;
  messageChannel?: OtpMessageChannel;
  userAgent: string;
  deviceToken: string;
  userIp?: string;
}

interface ISendOtpResult {
  status:
    | "SUCCESS"
    | "USER_NOT_FOUND"
    | "INVALID_CHANNEL"
    | "OTP_CHANNEL_REQUIRED"
    | "COOLDOWN_ACTIVE";
  transInfo?: TransInfo;
  payload?: {
    recipient: string;
    messageChannel?: OtpMessageChannel;
  };
  retryAfter?: number | null;
}

const COOLDOWN_SECONDS = 60;

/**
 * Handles verification code generation, rate-limiting guards, and delivery dispatches across communication channels.
 */
export const executeOtpDispatch = async (
  input: ISendOtpInput,
): Promise<ISendOtpResult> => {
  const { recipient, messageChannel, userIp } = input;
  const normalized = recipient.toLowerCase().trim();

  if (!messageChannel) {
    return {
      status: "OTP_CHANNEL_REQUIRED",
      transInfo: MESSAGES_REGISTRY.AUTH.OTP_CHANNEL_REQUIRED,
    };
  }

  if (
    messageChannel !== "EMAIL" &&
    messageChannel !== "SMS" &&
    messageChannel !== "WHATSAPP"
  ) {
    return {
      status: "INVALID_CHANNEL",
      transInfo: MESSAGES_REGISTRY.AUTH.INVALID_OTP_CHANNEL,
    };
  }

  const isEmail = messageChannel === "EMAIL";

  // Bypassing default document transformations to perform administrative context operations
  const user = await fetchSingleUser({
    identifier: recipient,
    flags: { lean: false, skipFilter: true },
  });

  if (!user) {
    const transMsg = isEmail
      ? MESSAGES_REGISTRY.AUTH.EMAIL_NOT_FOUND
      : MESSAGES_REGISTRY.AUTH.PHONE_NOT_FOUND;
    return {
      status: "USER_NOT_FOUND",
      transInfo: transMsg,
    };
  }

  const lastSentAt = isEmail
    ? user.lastEmailOtpSentAt
    : user.lastPhoneOtpSentAt;

  if (lastSentAt) {
    const elapsed = (Date.now() - lastSentAt.getTime()) / 1000;
    if (elapsed < COOLDOWN_SECONDS) {
      const secondsLeft = Math.ceil(COOLDOWN_SECONDS - elapsed);
      const transMsg = MESSAGES_REGISTRY.AUTH.RATE_LIMIT_ACTIVE(secondsLeft);
      return {
        status: "COOLDOWN_ACTIVE",
        transInfo: transMsg,
        retryAfter: secondsLeft,
      };
    }
  }

  const newCode = genVerificationCode();
  console.log(hashCode(newCode));
  user.otpCode = hashCode(newCode);
  user.otpCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  if (isEmail) {
    user.lastEmailOtpSentAt = new Date();
  } else {
    user.lastPhoneOtpSentAt = new Date();
  }

  await user.save();

  if (isEmail) {
    await dispatchEmailCode(
      {
        recipient: { email: normalized, firstName: user.firstName },
        code: newCode,
      },
      emailDispatchTokens,
    );
  } else if (messageChannel === "WHATSAPP") {
    await dispatchWhatsAppOtp(
      { phoneNumber: normalized, code: newCode, userIp },
      phoneDispatchTokens,
    );
  } else {
    await dispatchSmsOtp(
      { phoneNumber: normalized, code: newCode, userIp },
      phoneDispatchTokens,
    );
  }

  const msgTrans = isEmail
    ? MESSAGES_REGISTRY.AUTH.VERIFICATION_CODE_SENT_TO_EMAIL
    : MESSAGES_REGISTRY.AUTH.VERIFICATION_CODE_SENT_TO_PHONE;

  return {
    status: "SUCCESS",
    transInfo: msgTrans,
    payload: {
      recipient: normalized,
      messageChannel,
    },
  };
};

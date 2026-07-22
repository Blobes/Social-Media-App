import { IUserDocument, UserModel } from "@repo/database";
import {
  MESSAGES_REGISTRY,
  normalizeValue,
  TransInfo,
  enqueueOtpTask,
  genVerificationCode,
  getAccountStatusMsg,
} from "@repo/shared";

const FUNSTAKES_REDIS_URL = process.env.FUNSTAKES_REDIS_URL || "";

export interface IResetInitiationInput {
  identifier: string;
}

export interface IResetInitiationResult {
  status: "SUCCESS" | "MISSING_IDENTIFIER" | "NOT_FOUND" | "RESTRICTION";
  transInfo: TransInfo;
  payload: {
    resetType: "EMAIL" | "PHONE";
    destination: string;
  } | null;
}

/**
 * Handles account tracking checks and schedules transaction challenge dispatches for profile security resets.
 */
export const executeResetInitiation = async (
  input: IResetInitiationInput,
): Promise<IResetInitiationResult> => {
  const { identifier } = input;

  if (!identifier) {
    return {
      status: "MISSING_IDENTIFIER",
      transInfo: MESSAGES_REGISTRY.AUTH.IDENTIFIER_REQUIRED,
      payload: null,
    };
  }

  const formattedValue = normalizeValue(identifier);
  const isEmail = formattedValue.includes("@");

  const user = isEmail
    ? await UserModel.findByEmail({
        email: formattedValue.toLowerCase(),
        options: {
          skipFilter: true,
        },
      })
    : await UserModel.findByPhone({
        phoneNumber: formattedValue.replace(/\D/g, ""),
        options: {
          skipFilter: true,
        },
      });

  if (!user) {
    return {
      status: "NOT_FOUND",
      transInfo: isEmail
        ? MESSAGES_REGISTRY.AUTH.EMAIL_NOT_FOUND
        : MESSAGES_REGISTRY.AUTH.PHONE_NOT_FOUND,
      payload: null,
    };
  }

  const accountStatus = user.accountStatus;

  if (
    accountStatus === "DEACTIVATED" ||
    accountStatus === "SUSPENDED" ||
    accountStatus === "BANNED"
  ) {
    const restrictionMsg = getAccountStatusMsg(accountStatus, "restricted");
    return {
      status: "RESTRICTION",
      transInfo: restrictionMsg.transInfo,
      payload: null,
    };
  }

  const code = genVerificationCode();
  const resetDestination = isEmail ? user.email : user.phoneNumber;

  user.otpCode = code;
  user.otpCodeExpiresAt = new Date(Date.now() + 1000 * 60 * 15);
  await user.save();

  if (isEmail) {
    await enqueueOtpTask(FUNSTAKES_REDIS_URL, {
      email: user.email,
      code,
      type: "EMAIL",
    });
  } else {
    await enqueueOtpTask(FUNSTAKES_REDIS_URL, {
      phone: user.phoneNumber,
      code,
      type: "WHATSAPP",
    });
  }

  return {
    status: "SUCCESS",
    transInfo: isEmail
      ? MESSAGES_REGISTRY.AUTH.EMAIL_AVAILABLE
      : MESSAGES_REGISTRY.AUTH.PHONE_AVAILABLE,
    payload: {
      resetType: isEmail ? "EMAIL" : "PHONE",
      destination: resetDestination || "",
    },
  };
};

import { FUNSTAKES_REDIS_URL } from "@/envVars";
import {
  MESSAGES_REGISTRY,
  TransInfo,
  enqueueOtpTask,
  genVerificationCode,
  getAccountStatusMsg,
  fetchSingleUser,
  determineCheckType,
} from "@repo/shared";

export interface IResetInitiationInput {
  identifier: string;
}

export interface IResetInitiationResult {
  status:
    | "SUCCESS"
    | "MISSING_IDENTIFIER"
    | "NOT_FOUND"
    | "RESTRICTION"
    | "INVALID_IDENTIFIER";
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
      transInfo: MESSAGES_REGISTRY.AUTH.EMAIL_OR_PHONE_REQUIRED,
      payload: null,
    };
  }

  const isEmail = determineCheckType(identifier) === "EMAIL";
  const isPhone = determineCheckType(identifier) === "PHONE";

  if (!isEmail && !isPhone) {
    return {
      status: "INVALID_IDENTIFIER",
      transInfo: MESSAGES_REGISTRY.AUTH.INVALID_EMAIL_OR_PHONE,
      payload: null,
    };
  }

  const user = await fetchSingleUser({
    identifier,
    select: ["+password", "email", "phoneNumber", "accountStatus"],
    flags: {
      lean: false,
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
    const restrictionMsg = getAccountStatusMsg(accountStatus, "RESTRICTED");
    return {
      status: "RESTRICTION",
      transInfo: restrictionMsg.transInfo,
      payload: null,
    };
  }

  const code = genVerificationCode();
  user.otpCode = code;
  user.otpCodeExpiresAt = new Date(Date.now() + 1000 * 60 * 15);
  await user.save();

  if (isEmail) {
    await enqueueOtpTask(
      {
        email: user.email,
        code,
        type: "EMAIL",
        firstName: user.firstName,
      },
      FUNSTAKES_REDIS_URL,
    );
  } else {
    await enqueueOtpTask(
      {
        phone: user.phoneNumber,
        code,
        type: "WHATSAPP",
        firstName: user.firstName,
      },
      FUNSTAKES_REDIS_URL,
    );
  }

  const resetDestination = isEmail ? user.email : user.phoneNumber;

  return {
    status: "SUCCESS",
    transInfo: isEmail
      ? MESSAGES_REGISTRY.AUTH.VERIFICATION_CODE_SENT_TO_EMAIL
      : MESSAGES_REGISTRY.AUTH.VERIFICATION_CODE_SENT_TO_PHONE,
    payload: {
      resetType: isEmail ? "EMAIL" : "PHONE",
      destination: resetDestination || "",
    },
  };
};

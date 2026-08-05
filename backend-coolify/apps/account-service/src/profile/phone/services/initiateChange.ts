import { FUNSTAKES_REDIS_URL } from "@/envVars";
import {
  evaluateNotability,
  genVerificationCode,
  hashCode,
  enqueueOtpTask,
  TransInfo,
  MESSAGES_REGISTRY,
  fetchSingleUser,
} from "@repo/shared";

interface IInitiatePhoneChangeInput {
  userId: string;
  newPhoneNumber: string;
}

interface IInitiatePhoneChangeResult {
  status:
    | "SUCCESS"
    | "NOT_FOUND"
    | "COOLDOWN_ACTIVE"
    | "RATE_LIMIT_ACTIVE"
    | "PHONE_ALREADY_USED"
    | "PHONE_CONFLICT";
  transInfo: TransInfo;
  daysRemaining?: number;
  secondsToWait?: number;
  payload?: any;
}

/**
 * Checks infrastructure change cooldowns, updates pending profile vectors, and registers a verification task inside Redis.
 */
export const startPhoneChange = async (
  input: IInitiatePhoneChangeInput,
): Promise<IInitiatePhoneChangeResult> => {
  const { userId, newPhoneNumber } = input;
  const CHANGE_COOLDOWN = 90 * 24 * 60 * 60 * 1000;
  const SEND_COOLDOWN = 60 * 1000;

  // const user = await UserModel.findById(userId);

  const user = await fetchSingleUser({
    identifier: userId,
    flags: {
      lean: false,
    },
  });
  if (!user) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  // Enforce 90-day cooldown constraint on primary identification tokens
  if (user.lastPhoneChangeAt) {
    const timeSinceLastChange = Date.now() - user.lastPhoneChangeAt.getTime();
    if (timeSinceLastChange < CHANGE_COOLDOWN) {
      const daysRemaining = Math.ceil(
        (CHANGE_COOLDOWN - timeSinceLastChange) / (1000 * 60 * 60 * 24),
      );
      return {
        status: "COOLDOWN_ACTIVE",
        transInfo: MESSAGES_REGISTRY.AUTH.COOLDOWN_ACTIVE(daysRemaining),
        daysRemaining,
      };
    }
  }

  // Enforce single-minute delay window on messaging gateways
  if (user.lastPhoneOtpSentAt) {
    const timeSinceLastSent = Date.now() - user.lastPhoneOtpSentAt.getTime();
    if (timeSinceLastSent < SEND_COOLDOWN) {
      const secondsToWait = Math.ceil(
        (SEND_COOLDOWN - timeSinceLastSent) / 1000,
      );
      return {
        status: "RATE_LIMIT_ACTIVE",
        transInfo: MESSAGES_REGISTRY.AUTH.RATE_LIMIT_ACTIVE(secondsToWait),
        secondsToWait,
      };
    }
  }
  const formattedPhone = newPhoneNumber.trim();

  if (user.phoneNumber === formattedPhone) {
    return {
      status: "PHONE_ALREADY_USED",
      transInfo: MESSAGES_REGISTRY.AUTH.PHONE_ALREADY_USED,
    };
  }

  // Cross-reference registry records across soft-delete criteria bounds
  // const existingPhoneUser = await UserModel.findByPhone({
  //   phoneNumber: formattedPhone,
  //   filter: { _id: { $ne: userId } },
  //   options: { skipFilter: true },
  // });
  const existingPhoneUser = await fetchSingleUser({
    identifier: formattedPhone,
    query: { _id: { $ne: userId } },
    flags: {
      lean: false,
      identifierType: "PHONE",
      skipFilter: true,
    },
  });

  if (existingPhoneUser) {
    return {
      status: "PHONE_CONFLICT",
      transInfo: MESSAGES_REGISTRY.AUTH.PHONE_CONFLICT,
    };
  }

  // Recalculate platform notability indicators using incoming carrier signatures
  const fullName = `${user.firstName} ${user.lastName}`;
  const notability = await evaluateNotability(
    fullName,
    user.email,
    formattedPhone,
  );

  const code = genVerificationCode();

  user.pendingPhoneNumber = formattedPhone;
  user.otpCode = hashCode(code);
  user.otpCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  user.lastPhoneOtpSentAt = new Date();

  user.meritsVerification = notability.isVIPCandidate;
  user.isNotable = notability.isVIPCandidate;
  user.verificationSignals = {
    hasWikipedia: notability.signals.notableName,
    isVipEmail: notability.signals.proEmail,
    isVipPhone: notability.signals.validPhone,
  };

  await user.save();

  // Forward code dispatch instructions to worker processors
  await enqueueOtpTask(
    {
      phone: formattedPhone,
      code,
      type: "WHATSAPP",
    },
    FUNSTAKES_REDIS_URL,
  );

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.VERIFICATION_CODE_SENT_TO_PHONE,
    payload: {
      pendingPhoneNumber: user.pendingPhoneNumber,
      expiresAt: user.otpCodeExpiresAt,
      meritsVerification: user.meritsVerification,
    },
  };
};

import { FUNSTAKES_REDIS_URL } from "@/envVars";
import { UserModel } from "@repo/database";
import {
  evaluateNotability,
  genVerificationCode,
  hashCode,
  enqueueOtpTask,
  cleanDeviceSessions,
  invalidateCache,
  CACHE_KEYS,
  TransInfo,
  MESSAGES_REGISTRY,
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

interface IVerifyPhoneUpdateInput {
  userId: string;
  currentDeviceId?: string;
  code: string;
}

interface IVerifyPhoneUpdateResult {
  status: "SUCCESS" | "NOT_FOUND" | "EXPIRED" | "INVALID_CODE";
  transInfo: TransInfo;
  payload?: {
    phoneNumber: string;
    loggedOut: boolean;
  };
}

/**
 * Checks infrastructure change cooldowns, updates pending profile vectors, and registers a verification task inside Redis.
 */
export const initiatePhoneChange = async (
  input: IInitiatePhoneChangeInput,
): Promise<IInitiatePhoneChangeResult> => {
  const { userId, newPhoneNumber } = input;
  const CHANGE_COOLDOWN = 90 * 24 * 60 * 60 * 1000;
  const SEND_COOLDOWN = 60 * 1000;

  const user = await UserModel.findById(userId);
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
  if (user.lastPhoneCodeSentAt) {
    const timeSinceLastSent = Date.now() - user.lastPhoneCodeSentAt.getTime();
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
  const existingPhoneUser = await UserModel.findOne({
    phoneNumber: formattedPhone,
    _id: { $ne: userId },
  }).setOptions({ skipFilter: true });

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
  user.verificationCode = hashCode(code);
  user.verificationExpiry = new Date(Date.now() + 10 * 60 * 1000);
  user.lastPhoneCodeSentAt = new Date();

  user.meritsVerification = notability.isVIPCandidate;
  user.isNotable = notability.isVIPCandidate;
  user.verificationSignals = {
    hasWikipedia: notability.signals.notableName,
    isVipEmail: notability.signals.proEmail,
    isVipPhone: notability.signals.validPhone,
  };

  await user.save();

  // Forward code dispatch instructions to worker processors
  await enqueueOtpTask(FUNSTAKES_REDIS_URL, {
    phone: formattedPhone,
    code,
    type: "WHATSAPP",
  });

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.VERIFICATION_CODE_SENT_TO_PHONE,
    payload: {
      pendingPhoneNumber: user.pendingPhoneNumber,
      expiresAt: user.verificationExpiry,
      meritsVerification: user.meritsVerification,
    },
  };
};

/**
 * Validates incoming telephone verification codes, overrides verified numbers, and flushes unauthorized sessions.
 */
export const executePhoneUpdateVerification = async (
  input: IVerifyPhoneUpdateInput,
): Promise<IVerifyPhoneUpdateResult> => {
  const { userId, currentDeviceId, code } = input;

  const user = await UserModel.findById(userId);
  if (!user || !user.pendingPhoneNumber) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.NO_PENDING_PHONE_CHANGE,
    };
  }

  const isCodeValid = hashCode(code) === user.verificationCode;
  const isExpired = user.verificationExpiry
    ? new Date() > user.verificationExpiry
    : true;

  if (!isCodeValid || isExpired) {
    return {
      status: isExpired ? "EXPIRED" : "INVALID_CODE",
      transInfo: isExpired
        ? MESSAGES_REGISTRY.AUTH.EXPIRED
        : MESSAGES_REGISTRY.AUTH.INVALID_CODE,
    };
  }

  // Mutate profile configurations and strip temporary tracking markers
  user.phoneNumber = user.pendingPhoneNumber;
  user.pendingPhoneNumber = null;
  user.verificationCode = null;
  user.verificationExpiry = null;
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

  await invalidateCache(CACHE_KEYS.USER_PROFILE(userId));

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.PHONE_VERIFIED_SESSIONS_ENDED,
    payload: {
      phoneNumber: user.phoneNumber,
      loggedOut: !isCurrentDevicePrimary,
    },
  };
};

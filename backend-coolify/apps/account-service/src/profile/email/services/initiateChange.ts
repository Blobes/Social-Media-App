import { UserModel } from "@repo/database";
import { FUNSTAKES_REDIS_URL } from "@/envVars";
import {
  evaluateNotability,
  genVerificationCode,
  hashCode,
  CACHE_KEYS,
  invalidatePattern,
  enqueueOtpTask,
  TransInfo,
  MESSAGES_REGISTRY,
} from "@repo/shared";
import { verifyEncryptedPass } from "@/auth/helpers/encrypt";

interface IInitiateEmailChangeInput {
  userId: string;
  newEmail: string;
  password?: string;
}

interface IInitiateEmailChangeResult {
  status:
    | "SUCCESS"
    | "NOT_FOUND"
    | "PASSWORD_REQUIRED"
    | "NO_USER_PASSWORD_SET"
    | "INCORRECT_PASSWORD"
    | "COOLDOWN_ACTIVE"
    | "RATE_LIMIT_ACTIVE"
    | "EMAIL_ALREADY_USED"
    | "EMAIL_CONFLICT";
  transInfo: TransInfo;
  daysRemaining?: number;
  secondsToWait?: number;
  payload?: any;
}

/**
 * Validates cooldown limits, checks password status, and enqueues confirmation codes to change profile emails.
 */
export const startEmailChange = async (
  input: IInitiateEmailChangeInput,
): Promise<IInitiateEmailChangeResult> => {
  const { userId, newEmail, password } = input;
  const GRACE_PERIOD_MS = 15 * 60 * 1000;
  const ALLOWED_NO_OF_DAYS = 30 * 24 * 60 * 60 * 1000;
  const EMAIL_COOLDOWN = 60 * 1000;

  const user = await UserModel.findById(userId).select("+password");
  if (!user) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  // Evaluate credential lifespan metrics before enforcing account updates
  const lastVerified = user.lastPasswordVerifiedAt
    ? new Date(user.lastPasswordVerifiedAt).getTime()
    : 0;
  const isGracePeriodActive = Date.now() - lastVerified < GRACE_PERIOD_MS;

  if (!isGracePeriodActive) {
    if (!password) {
      return {
        status: "PASSWORD_REQUIRED",
        transInfo: MESSAGES_REGISTRY.AUTH.CURRENT_PASSWORD_REQUIRED,
      };
    }
    if (!user.password) {
      return {
        status: "NO_USER_PASSWORD_SET",
        transInfo: MESSAGES_REGISTRY.AUTH.NO_PASSWORD_SET,
      };
    }
    const isMatch = await verifyEncryptedPass(password, user.password);
    if (!isMatch) {
      return {
        status: "INCORRECT_PASSWORD",
        transInfo: MESSAGES_REGISTRY.AUTH.INCORRECT_CURRENT_PASSWORD,
      };
    }
    user.lastPasswordVerifiedAt = new Date();
  }

  // Enforce 30-day structural infrastructure changes spacing rule
  if (user.lastEmailChangeAt) {
    const timeSinceLastChange = Date.now() - user.lastEmailChangeAt.getTime();
    if (timeSinceLastChange < ALLOWED_NO_OF_DAYS) {
      const daysRemaining = Math.ceil(
        (ALLOWED_NO_OF_DAYS - timeSinceLastChange) / (1000 * 60 * 60 * 24),
      );
      return {
        status: "COOLDOWN_ACTIVE",
        transInfo: MESSAGES_REGISTRY.AUTH.COOLDOWN_ACTIVE(daysRemaining),
        daysRemaining,
      };
    }
  }

  // Prevent OTP resource exhaustion attacks
  if (user.lastEmailOtpSentAt) {
    const timeSinceLastSent = Date.now() - user.lastEmailOtpSentAt.getTime();
    if (timeSinceLastSent < EMAIL_COOLDOWN) {
      const secondsToWait = Math.ceil(
        (EMAIL_COOLDOWN - timeSinceLastSent) / 1000,
      );
      return {
        status: "RATE_LIMIT_ACTIVE",
        transInfo: MESSAGES_REGISTRY.AUTH.RATE_LIMIT_ACTIVE(secondsToWait),
        secondsToWait,
      };
    }
  }

  const formattedEmail = newEmail.toLowerCase().trim();
  if (user.email === formattedEmail) {
    return {
      status: "EMAIL_ALREADY_USED",
      transInfo: MESSAGES_REGISTRY.AUTH.EMAIL_ALREADY_USED,
    };
  }

  // Scan database registry index records, bypassing global soft delete scoping rules
  const existingEmailUser = await UserModel.findOne({
    email: formattedEmail,
    _id: { $ne: userId },
  }).setOptions({ skipFilter: true });

  if (existingEmailUser) {
    return {
      status: "EMAIL_CONFLICT",
      transInfo: MESSAGES_REGISTRY.AUTH.EMAIL_CONFLICT,
    };
  }

  // Fetch verified profile status indicators from context targets
  const fullName = `${user.firstName} ${user.lastName}`;
  const notability = await evaluateNotability(
    fullName,
    formattedEmail,
    user.phoneNumber || undefined,
  );

  const code = genVerificationCode();
  const now = new Date();

  user.pendingEmail = formattedEmail;
  user.otpCode = hashCode(code);
  user.otpCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  user.lastEmailOtpSentAt = now;

  user.meritsVerification = notability.isVIPCandidate;
  user.isNotable = notability.isVIPCandidate;
  user.verificationSignals = {
    hasWikipedia: notability.signals.notableName,
    isVipEmail: notability.signals.proEmail,
    isVipPhone: notability.signals.validPhone,
  };

  await user.save();

  // Clear data lookup endpoints
  await invalidatePattern(CACHE_KEYS.WILDCARD_USER_ALL(userId));

  // Forward code dispatch instructions to worker processors
  await enqueueOtpTask(FUNSTAKES_REDIS_URL, {
    email: formattedEmail,
    code,
    type: "EMAIL",
  });

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.VERIFICATION_CODE_SENT_TO_EMAIL,
    payload: {
      pendingEmail: user.pendingEmail,
      expiresAt: user.otpCodeExpiresAt,
      meritsVerification: user.meritsVerification,
    },
  };
};

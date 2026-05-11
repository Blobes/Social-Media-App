import { FUNSTAKES_REDIS_URL } from "@/envVars";
import { UserModel } from "@repo/database";
import bcrypt from "bcrypt";
import {
  IAuthRequest,
  OtpType,
  evaluateNotability,
  genVerificationCode,
  hashCode,
  otpQueue,
  CACHE_KEYS,
  invalidatePattern,
} from "@repo/shared";
import { Response } from "express";

interface UserEmailRequest extends IAuthRequest {
  body: {
    newEmail: string;
    password?: string; // Optional due to grace period
  };
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Initiates email change with a 15-minute password grace period.
 */
export const changeEmail = async (
  req: UserEmailRequest,
  res: Response,
): Promise<any> => {
  const userId = req.user?.id;
  const { newEmail, password } = req.body;
  const GRACE_PERIOD_MS = 15 * 60 * 1000;

  // Validate identity and authentication status
  if (!userId) {
    return res.status(401).json({
      message: "Unauthorized access",
      status: "ERROR",
      payload: null,
    });
  }

  // Validate email format and presence
  if (!newEmail || !emailRegex.test(newEmail)) {
    return res.status(400).json({
      message: "Invalid email format",
      status: "ERROR",
      payload: null,
    });
  }

  try {
    // Fetch user document with password for verification
    const user = await UserModel.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        status: "ERROR",
        payload: null,
      });
    }

    // --- GRACE PERIOD / PASSWORD CHECK ---
    const lastVerified = user.lastPasswordVerifiedAt
      ? new Date(user.lastPasswordVerifiedAt).getTime()
      : 0;
    const isGracePeriodActive = Date.now() - lastVerified < GRACE_PERIOD_MS;

    if (!isGracePeriodActive) {
      if (!password) {
        return res.status(400).json({
          status: "ERROR",
          message: "Please provide your password to confirm identity.",
          payload: null,
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          status: "ERROR",
          message: "Incorrect password.",
          payload: null,
        });
      }

      // Update the password verification timestamp
      user.lastPasswordVerifiedAt = new Date();
    }

    // --- 30-DAY COOLDOWN CHECK ---
    const ALLOWED_NO_OF_DAYS = 30 * 24 * 60 * 60 * 1000;
    if (user.lastEmailChangeAt) {
      const timeSinceLastChange = Date.now() - user.lastEmailChangeAt.getTime();
      if (timeSinceLastChange < ALLOWED_NO_OF_DAYS) {
        const daysRemaining = Math.ceil(
          (ALLOWED_NO_OF_DAYS - timeSinceLastChange) / (1000 * 60 * 60 * 24),
        );
        return res.status(429).json({
          message: `You can only change your email once every 30 days. Please wait ${daysRemaining} more days.`,
          status: "ERROR",
          payload: null,
        });
      }
    }

    // --- RATE LIMITING FOR OTP ---
    const EMAIL_COOLDOWN = 60 * 1000;
    if (user.lastEmailCodeSentAt) {
      const timeSinceLastSent = Date.now() - user.lastEmailCodeSentAt.getTime();
      if (timeSinceLastSent < EMAIL_COOLDOWN) {
        const secondsToWait = Math.ceil(
          (EMAIL_COOLDOWN - timeSinceLastSent) / 1000,
        );
        return res.status(429).json({
          message: `Please wait ${secondsToWait} seconds before requesting another code.`,
          status: "ERROR",
          payload: null,
        });
      }
    }

    const formattedEmail = newEmail.toLowerCase();

    // Prevent update if the email is identical to current
    if (user.email === formattedEmail) {
      return res.status(400).json({
        message: "You are already using this email",
        status: "ERROR",
        payload: null,
      });
    }

    // --- AVAILABILITY CHECK (Including deactivated accounts) ---
    const existingEmailUser = await UserModel.findOne({
      email: formattedEmail,
      _id: { $ne: userId },
    }).setOptions({ skipFilter: true });

    if (existingEmailUser) {
      return res.status(409).json({
        message: "Email is already in use or reserved by a deactivated account",
        status: "ERROR",
        payload: null,
      });
    }

    // Re-evaluate notability signals based on the new email domain
    const fullName = `${user.firstName} ${user.lastName}`;
    const notability = await evaluateNotability(
      fullName,
      formattedEmail,
      user.phoneNumber || undefined,
    );

    // Generate verification code and set expiry
    const code = genVerificationCode();
    const now = new Date();

    user.pendingEmail = formattedEmail;
    user.verificationCode = hashCode(code);
    user.verificationExpiry = new Date(Date.now() + 15 * 60 * 1000);
    user.lastEmailCodeSentAt = now;

    // Update notability and verification signals
    user.meritsVerification = notability.isVIPCandidate;
    user.isNotable = notability.isVIPCandidate;
    user.verificationSignals = {
      hasWikipedia: notability.signals.notableName,
      isVipEmail: notability.signals.proEmail,
      isVipPhone: notability.signals.validPhone,
    };

    // Persist changes
    await user.save();

    // Invalidate user cache since profile signals changed
    await invalidatePattern(CACHE_KEYS.WILDCARD_USER_ALL(userId));

    // Dispatch verification code
    await otpQueue(FUNSTAKES_REDIS_URL).add(
      "send-email-otp",
      { email: formattedEmail, code, type: "EMAIL" as OtpType },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: true,
      },
    );

    return res.status(200).json({
      message:
        "Verification code sent to your new email. Please verify to complete the change.",
      status: "SUCCESS",
      payload: {
        pendingEmail: user.pendingEmail,
        expiresAt: user.verificationExpiry,
        meritsVerification: user.meritsVerification,
      },
    });
  } catch (error: any) {
    console.error("Change Email Error:", error);
    return res.status(500).json({
      message: error.message || "Server error",
      status: "ERROR",
      payload: null,
    });
  }
};

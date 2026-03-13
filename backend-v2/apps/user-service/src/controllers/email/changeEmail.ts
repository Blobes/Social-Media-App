import { UserModel } from "@repo/database";
import {
  AuthRequest,
  dispatchEmailCode,
  evaluateNotability,
  genVerificationCode,
  hashCode,
} from "@repo/shared";
import { Response } from "express";

interface UserEmailRequest extends AuthRequest {
  body: {
    newEmail: string;
  };
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const changeEmail = async (
  req: UserEmailRequest,
  res: Response,
): Promise<any> => {
  const userId = req.user?.id;
  const { newEmail } = req.body;

  // --- IDENTITY VALIDATION ---
  if (!userId) {
    return res.status(401).json({
      message: "Unauthorized access",
      status: "ERROR",
      payload: null,
    });
  }

  // --- INPUT VALIDATION ---
  if (!newEmail || !emailRegex.test(newEmail)) {
    return res.status(400).json({
      message: "Invalid email format",
      status: "ERROR",
      payload: null,
    });
  }

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        status: "ERROR",
        payload: null,
      });
    }

    // --- 90-DAY COOLDOWN CHECK ---
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

    // --- RATE LIMITING ---
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

    if (user.email === formattedEmail) {
      return res.status(400).json({
        message: "You are already using this email",
        status: "ERROR",
        payload: null,
      });
    }

    // --- AVAILABILITY CHECK ---
    const existingEmailUser = await UserModel.findOne({
      email: formattedEmail,
      _id: { $ne: userId },
    });

    if (existingEmailUser) {
      return res.status(409).json({
        message: "Email is already in use by another account",
        status: "ERROR",
        payload: null,
      });
    }

    // --- NEW: RE-EVALUATE NOTABILITY FOR NEW EMAIL ---
    // We check if the new email still supports their "Public Figure" status
    const fullName = `${user.firstName} ${user.lastName}`;
    const notability = await evaluateNotability(
      fullName,
      formattedEmail,
      user.phoneNumber || undefined,
    );

    // --- PREPARE PENDING UPDATE ---
    const code = genVerificationCode();
    const now = new Date();

    user.pendingEmail = formattedEmail;
    user.verificationCode = hashCode(code);
    user.verificationExpiry = new Date(Date.now() + 15 * 60 * 1000);
    user.lastEmailCodeSentAt = now;

    // UPDATE NOTABILITY SIGNALS
    // Even if they are already a public figure, we update the signals
    // to reflect the reputation of the new email.
    user.meritsVerification = notability.isVIPCandidate;
    user.isNotable = notability.isVIPCandidate;
    user.verificationSignals = {
      hasWikipedia: notability.signals.notableName,
      isVipEmail: notability.signals.proEmail,
      isVipPhone: notability.signals.validPhone,
    };

    await user.save();

    // Send code to the NEW email
    await dispatchEmailCode({ to: formattedEmail, code });

    return res.status(200).json({
      message:
        "Verification code sent to your new email. Please verify to complete the change.",
      status: "SUCCESS",
      payload: {
        pendingEmail: user.pendingEmail,
        expiresAt: user.verificationExpiry,
        meritsVerification: user.meritsVerification, // Notify UI if status changed
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

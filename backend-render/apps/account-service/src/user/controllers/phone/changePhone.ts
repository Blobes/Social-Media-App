import { UserModel } from "@repo/database";
import {
  IAuthRequest,
  OtpType,
  evaluateNotability,
  genVerificationCode,
  hashCode,
  otpQueue,
} from "@repo/shared";
import { Response } from "express";

interface UserPhoneRequest extends IAuthRequest {
  body: {
    newPhoneNumber: string;
  };
}

// Basic regex for international phone numbers (E.164 format)
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

export const changePhoneNumber = async (
  req: UserPhoneRequest,
  res: Response,
): Promise<any> => {
  const userId = req.user?.id;
  const { newPhoneNumber } = req.body;

  if (!userId) {
    return res.status(401).json({
      status: "ERROR",
      message: "Unauthorized access.",
      payload: null,
    });
  }

  if (!newPhoneNumber || !phoneRegex.test(newPhoneNumber)) {
    return res.status(400).json({
      status: "ERROR",
      message:
        "Invalid phone number format. Please use E.164 format (e.g., +234...).",
      payload: null,
    });
  }

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "ERROR",
        message: "User not found.",
        payload: null,
      });
    }

    // --- 90-DAY COOLDOWN CHECK ---
    const CHANGE_COOLDOWN = 90 * 24 * 60 * 60 * 1000;
    if (user.lastPhoneChangeAt) {
      const timeSinceLastChange = Date.now() - user.lastPhoneChangeAt.getTime();
      if (timeSinceLastChange < CHANGE_COOLDOWN) {
        const daysRemaining = Math.ceil(
          (CHANGE_COOLDOWN - timeSinceLastChange) / (1000 * 60 * 60 * 24),
        );
        return res.status(429).json({
          status: "ERROR",
          message: `You can only change your phone number once every 90 days. Please wait ${daysRemaining} more days.`,
          payload: null,
        });
      }
    }

    // --- RATE LIMITING (60s Cooldown) ---
    const SEND_COOLDOWN = 60 * 1000;
    if (user.lastPhoneCodeSentAt) {
      const timeSinceLastSent = Date.now() - user.lastPhoneCodeSentAt.getTime();
      if (timeSinceLastSent < SEND_COOLDOWN) {
        const secondsToWait = Math.ceil(
          (SEND_COOLDOWN - timeSinceLastSent) / 1000,
        );
        return res.status(429).json({
          status: "ERROR",
          message: `Please wait ${secondsToWait} seconds before requesting another WhatsApp code.`,
          payload: null,
        });
      }
    }

    const formattedPhone = newPhoneNumber.trim();

    if (user.phoneNumber === formattedPhone) {
      return res.status(400).json({
        status: "ERROR",
        message: "You are already using this phone number.",
        payload: null,
      });
    }

    // --- AVAILABILITY CHECK ---
    const existingPhoneUser = await UserModel.findOne({
      phoneNumber: formattedPhone,
      _id: { $ne: userId },
    }).setOptions({ skipFilter: true });

    if (existingPhoneUser) {
      return res.status(409).json({
        status: "ERROR",
        message: "This phone number is already linked to another account.",
        payload: null,
      });
    }

    // --- NEW: RE-EVALUATE NOTABILITY FOR NEW PHONE ---
    // We check if the new phone number (and existing email) still meets VIP criteria
    const fullName = `${user.firstName} ${user.lastName}`;
    const notability = await evaluateNotability(
      fullName,
      user.email,
      formattedPhone,
    );

    // --- PREPARE PENDING UPDATE ---
    const code = genVerificationCode();

    user.pendingPhoneNumber = formattedPhone;
    user.verificationCode = hashCode(code);
    user.verificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    user.lastPhoneCodeSentAt = new Date();

    // UPDATE NOTABILITY SIGNALS
    // We update the signals to reflect the carrier/type intelligence of the new number
    user.meritsVerification = notability.isVIPCandidate;
    user.isNotable = notability.isVIPCandidate;
    user.verificationSignals = {
      hasWikipedia: notability.signals.notableName,
      isVipEmail: notability.signals.proEmail,
      isVipPhone: notability.signals.validPhone,
    };

    await user.save();

    // Send code via WhatsApp
    await otpQueue.add(
      "send-email-otp",
      { phone: formattedPhone, code, type: "WHATSAPP" as OtpType },
      {
        attempts: 3, // Try 3 times total
        backoff: {
          type: "exponential",
          delay: 2000, // Wait 2s, then 4s, then 8s...
        },
        removeOnComplete: true, // Keep Redis clean
      },
    );

    return res.status(200).json({
      status: "SUCCESS",
      message: "Verification code sent to your new WhatsApp number.",
      payload: {
        pendingPhoneNumber: user.pendingPhoneNumber,
        expiresAt: user.verificationExpiry,
        meritsVerification: user.meritsVerification,
      },
    });
  } catch (error: any) {
    console.error("Change Phone Error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to initiate phone number change.",
      payload: null,
    });
  }
};

import { UserModel } from "@repo/database";
import {
  dispatchEmailCode,
  dispatchWhatsAppCode,
  genVerificationCode,
  hashCode,
  setOtpChannel,
  VerificationPurpose,
} from "@repo/shared";
import { Request, Response } from "express";

const VALID_PURPOSES: VerificationPurpose[] = ["LOGIN", "ACCOUNT_UPDATE"];

const COOLDOWN_SECONDS = 60;

/**
 * Sends a verification code to an email or phone number.
 * Purpose is validated at send time only — never stored on the user document.
 *
 * Purposes:
 *   - LOGIN          → skips already-verified guard; always dispatches
 *   - ACCOUNT_UPDATE → requires pendingEmail/pendingPhone; skips if already verified
 */
export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  const { destination, purpose } = req.body as {
    destination?: string;
    purpose?: VerificationPurpose;
  };

  if (!destination) {
    res.status(400).json({
      status: "ERROR",
      message: "A destination email or phone number is required.",
      payload: null,
    });
    return;
  }

  if (!purpose || !VALID_PURPOSES.includes(purpose)) {
    res.status(400).json({
      status: "ERROR",
      message: `A valid purpose is required. Accepted values: ${VALID_PURPOSES.join(", ")}.`,
      payload: null,
    });
    return;
  }

  const normalized = destination.toLowerCase().trim();
  const channel = setOtpChannel(normalized);

  if (!channel) {
    res.status(400).json({
      status: "ERROR",
      message: "OTP channel must be a valid email address or phone number.",
      payload: null,
    });
    return;
  }

  try {
    const user = await UserModel.findOne(
      channel === "EMAIL" ? { email: normalized } : { phoneNumber: normalized },
    );

    if (!user) {
      res.status(404).json({
        status: "ERROR",
        message: `No account found for this ${channel === "EMAIL" ? "email address" : "phone number"}.`,
        payload: null,
      });
      return;
    }

    if (purpose === "ACCOUNT_UPDATE") {
      // Pending change must be queued before a code can be sent
      const hasPending =
        channel === "EMAIL" ? !!user.pendingEmail : !!user.pendingPhoneNumber;

      if (!hasPending) {
        res.status(400).json({
          status: "ERROR",
          message: `No pending ${channel} change found. Initiate a ${channel} update request first.`,
          payload: null,
        });
        return;
      }

      // Already verified with no pending change in flight — nothing to do
      const isAlreadyVerified =
        channel === "EMAIL"
          ? !user.pendingEmail && user.isEmailVerified
          : !user.pendingPhoneNumber && user.isPhoneVerified;

      if (isAlreadyVerified) {
        res.status(400).json({
          status: "ERROR",
          message: `This ${channel === "EMAIL" ? "email address" : "phone number"} is already verified.`,
          payload: null,
        });
        return;
      }
    }

    // Rate limit
    const lastSentAt =
      channel === "EMAIL" ? user.lastEmailCodeSentAt : user.lastPhoneCodeSentAt;

    if (lastSentAt) {
      const elapsed = (Date.now() - lastSentAt.getTime()) / 1000;

      if (elapsed < COOLDOWN_SECONDS) {
        res.status(429).json({
          status: "ERROR",
          message: `Please wait ${Math.ceil(COOLDOWN_SECONDS - elapsed)} seconds before requesting a new code.`,
          payload: null,
        });
        return;
      }
    }

    // Generate and persist code — purpose is NOT stored
    const newCode = genVerificationCode();
    user.verificationCode = hashCode(newCode);
    user.verificationExpiry = new Date(Date.now() + 10 * 60 * 1000);

    if (channel === "EMAIL") {
      user.lastEmailCodeSentAt = new Date();
    } else {
      user.lastPhoneCodeSentAt = new Date();
    }

    await user.save();

    // Dispatch — fire-and-forget
    try {
      if (channel === "EMAIL") {
        await dispatchEmailCode({ to: normalized, code: newCode });
      } else {
        await dispatchWhatsAppCode({ to: normalized, code: newCode });
      }
    } catch (dispatchError) {
      console.error(`[sendCode] ${channel} dispatch failed:`, dispatchError);
    }

    res.status(200).json({
      status: "SUCCESS",
      message: `A verification code has been sent to your ${channel === "EMAIL" ? "email address" : "phone number"}.`,
      payload: { destination, channel, purpose },
    });
  } catch (error) {
    console.error("[sendCode] Error:", error);
    res.status(500).json({
      status: "ERROR",
      message:
        error instanceof Error
          ? error.message
          : "Failed to send verification code.",
      payload: null,
    });
  }
};

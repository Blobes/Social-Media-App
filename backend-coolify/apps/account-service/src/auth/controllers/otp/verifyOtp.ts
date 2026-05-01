import { UserModel } from "@repo/database";
import {
  CACHE_KEYS,
  hashCode,
  invalidatePattern,
  setOtpChannel,
  VerificationPurpose,
} from "@repo/shared";
import { Request, Response } from "express";
import {
  handleChannelVerification,
  handleDeviceTrust,
  handleAccountUpdate,
} from "../../helpers/otpHandlers";

/**
 * Verifies OTP and delegates post-verification logic to imported handlers.
 */
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  const { source, code, purpose, deviceId } = req.body as {
    source?: string;
    code?: string;
    purpose?: VerificationPurpose;
    deviceId?: string;
  };

  if (!source || !code || !purpose) {
    res.status(400).json({
      status: "ERROR",
      message: "Source, code, and purpose are required.",
      payload: null,
    });
    return;
  }

  const normalized = source.toLowerCase().trim();
  const otpChannel = setOtpChannel(normalized);

  if (!otpChannel) {
    res.status(400).json({
      status: "ERROR",
      message: "Invalid OTP channel source.",
      payload: null,
    });
    return;
  }

  try {
    const user = await UserModel.findOne(
      otpChannel === "EMAIL"
        ? { email: normalized }
        : { phoneNumber: normalized },
    );

    if (!user) {
      res.status(404).json({
        status: "ERROR",
        message: "Account not found.",
        payload: null,
      });
      return;
    }

    // 1. DUMB VALIDATION: Check code and expiry
    if (!user.verificationCode || !user.verificationExpiry) {
      res.status(400).json({
        status: "ERROR",
        message: "No active verification process found.",
        payload: null,
      });
      return;
    }

    if (Date.now() > user.verificationExpiry.getTime()) {
      res.status(400).json({
        status: "ERROR",
        message: "Verification code has expired.",
        payload: null,
      });
      return;
    }

    if (hashCode(code) !== user.verificationCode) {
      res.status(400).json({
        status: "ERROR",
        message: "Invalid verification code.",
        payload: null,
      });
      return;
    }

    /**
     * 2. ACTION DELEGATION: Execute logic based on the 'purpose' flag
     */
    switch (purpose) {
      case "LOGIN":
        // Reset 15-day window/trust device on login verification
        if (deviceId) {
          await handleDeviceTrust(user, deviceId);
        }
        await handleChannelVerification(user, otpChannel);
        break;

      case "ACCOUNT_UPDATE":
        await handleAccountUpdate(user, otpChannel);
        break;

      default:
        // Default to just verifying the channel if purpose is unrecognized
        await handleChannelVerification(user, otpChannel);
        break;
    }

    // 3. CLEANUP: Clear code and persist changes
    user.verificationCode = null;
    user.verificationExpiry = null;

    await user.save();
    await invalidatePattern(CACHE_KEYS.WILDCARD_USER_ALL(String(user._id)));

    res.status(200).json({
      status: "SUCCESS",
      message: "Verified successfully.",
      payload: { purpose, channel: otpChannel },
    });
  } catch (error) {
    console.error("[verifyOtp] Error:", error);
    res.status(500).json({
      status: "ERROR",
      message:
        error instanceof Error ? error.message : "Internal server error.",
      payload: null,
    });
  }
};

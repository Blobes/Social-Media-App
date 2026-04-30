import { UserModel } from "@repo/database";
import {
  CACHE_KEYS,
  hashCode,
  invalidatePattern,
  setOtpChannel,
} from "@repo/shared";
import { Request, Response } from "express";

/**
 * Verifies a code sent to an email address or phone number.
 * Marks the destination as verified on success and clears the code.
 */
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  const { source, code } = req.body as {
    source?: string;
    code?: string;
  };

  if (!source || !code) {
    res.status(400).json({
      status: "ERROR",
      message: "OTP source and code are required.",
      payload: null,
    });
    return;
  }

  const normalized = source.toLowerCase().trim();
  const otpChannel = setOtpChannel(normalized);

  if (!otpChannel) {
    res.status(400).json({
      status: "ERROR",
      message: "OTP channel must be a valid email address or phone number.",
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
        message: "No account found for this destination.",
        payload: null,
      });
      return;
    }

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

    // Mark destination as verified and clear code
    if (otpChannel === "EMAIL") {
      user.isEmailVerified = true;
      user.lastEmailCodeSentAt = null;
    } else {
      user.isPhoneVerified = true;
      user.lastPhoneCodeSentAt = null;
    }

    user.verificationCode = null;
    user.verificationExpiry = null;

    await user.save();

    await invalidatePattern(CACHE_KEYS.WILDCARD_USER_ALL(String(user._id)));

    res.status(200).json({
      status: "SUCCESS",
      message: `${otpChannel === "EMAIL" ? "Email" : "Phone number"} verified successfully.`,
      payload: null,
    });
  } catch (error) {
    console.error("[verifyCode] Error:", error);
    res.status(500).json({
      status: "ERROR",
      message:
        error instanceof Error ? error.message : "Internal server error.",
      payload: null,
    });
  }
};

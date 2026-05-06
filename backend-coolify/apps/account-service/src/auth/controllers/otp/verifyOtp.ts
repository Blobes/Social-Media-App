import { DeviceModel, UserModel } from "@repo/database";
import {
  CACHE_KEYS,
  ensurePrimaryDevice,
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
  const { recipient, code, purpose } = req.body as {
    recipient?: string;
    code?: string;
    purpose?: VerificationPurpose;
  };

  if (!recipient || !code || !purpose) {
    res.status(400).json({
      status: "ERROR",
      message: "Source, code, and purpose are required.",
      payload: null,
    });
    return;
  }

  // 1. Identify Identity Hint (The Device Token from Cookie)
  const deviceToken = req.cookies["device_token"];

  const normalized = recipient.toLowerCase().trim();
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
    ).setOptions({ skipFilter: true });

    if (!user) {
      res.status(404).json({
        status: "ERROR",
        message: "Account not found.",
        payload: null,
      });
      return;
    }

    // 2. OTP VALIDATION
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
     * 3. ACTION DELEGATION
     */
    switch (purpose) {
      case "LOGIN":
        // Reset the 15-day trust window for the specific device linked to this cookie
        if (deviceToken) {
          await handleDeviceTrust(user, deviceToken, req);
        }
        await handleChannelVerification(user, otpChannel);
        break;

      case "ACCOUNT_UPDATE":
        await handleAccountUpdate(user, otpChannel);
        break;

      default:
        await handleChannelVerification(user, otpChannel);
        break;
    }

    // 4. SELF-HEAL PRIMARY
    // If the user just verified a device but has no primary assigned, fix it now.
    const currentDeviceId = deviceToken
      ? (
          await DeviceModel.findOne({ userId: user._id, deviceToken }).select(
            "_id",
          )
        )?._id
      : undefined;

    await ensurePrimaryDevice(user, currentDeviceId?.toString());

    // 5. CLEANUP
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

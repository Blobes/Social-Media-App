import { otpWorkflowRegistry } from "@/auth/helpers/otpActions";
import { DeviceModel, UserModel } from "@repo/database";
import {
  CACHE_KEYS,
  ensurePrimaryDevice,
  getOrSetDeviceToken,
  hashCode,
  invalidatePattern,
  setOtpChannel,
  VerificationPurpose,
} from "@repo/shared";
import { Request, Response } from "express";

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  const { recipient, code, purpose } = req.body as {
    recipient?: string;
    code?: string;
    purpose?: VerificationPurpose;
  };

  if (!recipient || !code || !purpose) {
    res.status(400).json({
      status: "ERROR",
      message: "Missing required fields.",
      payload: null,
    });
    return;
  }

  const deviceToken = getOrSetDeviceToken(req, res);
  const normalized = recipient.toLowerCase().trim();
  const otpChannel = setOtpChannel(normalized);

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

    // OTP Logic Check
    if (
      !user.verificationCode ||
      !user.verificationExpiry ||
      Date.now() > user.verificationExpiry.getTime()
    ) {
      res.status(400).json({
        status: "ERROR",
        message: "Code expired or not found.",
        payload: null,
      });
      return;
    }

    if (hashCode(code) !== user.verificationCode) {
      res
        .status(400)
        .json({ status: "ERROR", message: "Invalid code.", payload: null });
      return;
    }

    // Trace execution for trackability
    console.log(
      `[OTP_TRACE] Purpose: ${purpose} | User: ${user._id} | Channel: ${otpChannel}`,
    );

    // Execute strategy
    let actionPayload = null;
    const workflow = otpWorkflowRegistry[purpose];
    if (workflow) actionPayload = await workflow(user, req, res);

    // Self-Heal Primary Device
    const currentDevice = deviceToken
      ? await DeviceModel.findOne({ userId: user._id, deviceToken }).select(
          "_id",
        )
      : null;
    await ensurePrimaryDevice(user, currentDevice?._id?.toString());

    // Finalize state
    user.verificationCode = null;
    user.verificationExpiry = null;
    await user.save();

    await invalidatePattern(CACHE_KEYS.WILDCARD_USER_ALL(String(user._id)));

    res.status(200).json({
      status: "SUCCESS",
      message: "Verified successfully.",
      payload: { ...actionPayload, purpose, channel: otpChannel },
    });
  } catch (error: any) {
    console.error(`[OTP_ERROR] ${purpose}:`, error);
    res.status(error.status || 500).json({
      status: "ERROR",
      message: error.message || "Verification failed.",
      payload: null,
    });
  }
};

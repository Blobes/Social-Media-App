import { NextFunction, Request, Response } from "express";
import {
  VerificationPurpose,
  getOrSetDeviceToken,
  MESSAGES_REGISTRY,
  forwardError,
} from "@repo/shared";
import { executeOtpDispatch } from "@/auth/otp/services/otpDispatcher";
import { clearAuthCookies } from "@repo/security";

/**
 * Controller endpoint to handle verification code requests.
 */
export const sendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { recipient, purpose } = req.body as {
    recipient?: string;
    purpose?: VerificationPurpose;
  };

  const VALID_PURPOSES: VerificationPurpose[] =
    Object.values(VerificationPurpose);

  if (!recipient) {
    res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.EMAIL_OR_PHONE_REQUIRED,
      payload: null,
    });
    return;
  }

  if (!purpose || !VALID_PURPOSES.includes(purpose)) {
    res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.INVALID_OTP_DISPATCH_PURPOSE,
      payload: null,
    });
    return;
  }

  const deviceToken = getOrSetDeviceToken(req, res);
  const userAgent = req.headers["user-agent"] || "unknown";

  try {
    const serviceResult = await executeOtpDispatch({
      recipient,
      purpose,
      userAgent,
      deviceToken,
    });

    if (serviceResult.status !== "SUCCESS") {
      const errorCode =
        serviceResult.status === "USER_NOT_FOUND"
          ? 404
          : serviceResult.status === "COOLDOWN_ACTIVE"
            ? 429
            : 400;
      res.status(errorCode).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
      return;
    }

    // Check if the service execution requested client cookie eviction
    if (serviceResult.payload?.actionPayload?.clearLocalCookies) {
      clearAuthCookies(res);
      delete serviceResult.payload.actionPayload.clearLocalCookies;
    }

    res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("[sendCode] Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};

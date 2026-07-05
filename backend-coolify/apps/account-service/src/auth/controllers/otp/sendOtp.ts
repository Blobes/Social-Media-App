import { NextFunction, Request, Response } from "express";
import {
  VerificationPurpose,
  getOrSetDeviceToken,
  clearAuthCookies,
  MESSAGES_REGISTRY,
  forwardError,
} from "@repo/shared";
import { executeOtpDispatch } from "@/auth/services/otpDispatcher";

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
      ...MESSAGES_REGISTRY.AUTH.EMAIL_REQUIRED,
      payload: null,
    });
    return;
  }

  if (!purpose || !VALID_PURPOSES.includes(purpose)) {
    res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.INVALID_PASSWORD_PURPOSE,
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

    // Check if the service execution requested client cookie eviction
    if (serviceResult.payload.actionPayload?.clearLocalCookies) {
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
      error.message
        ? MESSAGES_REGISTRY.AUTH.SERVER_THROWN_ERROR(error.message)
        : MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};

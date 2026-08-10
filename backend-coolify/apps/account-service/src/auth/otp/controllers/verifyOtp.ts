import { NextFunction, Request, Response } from "express";
import {
  VerificationPurpose,
  getOrSetDeviceToken,
  MESSAGES_REGISTRY,
  forwardError,
} from "@repo/shared";
import { executeOtpVerification } from "@/auth/otp/services/optVerifier";
import { clearAuthCookies } from "@repo/security";

/**
 * Controller endpoint to handle incoming validation requests for transactional OTP records.
 */
export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { recipient, code, purpose } = req.body as {
    recipient?: string;
    code?: string;
    purpose?: VerificationPurpose;
  };

  if (!recipient || !code || !purpose) {
    res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.CODE_RECIPIENT_PURPOSE_REQUIRED,
      payload: null,
    });
    return;
  }

  const deviceToken = getOrSetDeviceToken(req, res);
  const userAgent = req.headers["user-agent"] || "unknown";

  try {
    const serviceResult = await executeOtpVerification({
      recipient,
      code,
      purpose,
      deviceToken,
      userAgent,
    });

    if (serviceResult.status !== "SUCCESS") {
      res.status(serviceResult.status === "USER_NOT_FOUND" ? 404 : 400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
      return;
    }

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
    console.error(`[OTP_ERROR] ${purpose}:`, error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};

import { NextFunction, Request, Response } from "express";
import { forwardError, MESSAGES_REGISTRY } from "@repo/shared";
import { executeOtpReset, IResetOtpInput } from "../services/resetOtp";

/**
 * Controller endpoint to handle resetting user OTP verification states.
 */
export const resetMessagingOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { recipient } = req.body as IResetOtpInput;

  if (!recipient) {
    res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.EMAIL_OR_PHONE_REQUIRED,
      payload: null,
    });
    return;
  }

  try {
    const serviceResult = await executeOtpReset({ recipient });

    if (serviceResult.status !== "SUCCESS") {
      const errorCode = serviceResult.status === "USER_NOT_FOUND" ? 404 : 400;

      res.status(errorCode).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
      return;
    }

    res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: null,
    });
  } catch (error: unknown) {
    console.error("[resetChannelOtp] Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};

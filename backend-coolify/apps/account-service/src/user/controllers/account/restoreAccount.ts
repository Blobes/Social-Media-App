import { NextFunction, Response } from "express";
import {
  IAuthRequest,
  MESSAGES_REGISTRY,
  forwardError,
  getOrSetDeviceToken,
} from "@repo/shared";
import { executeAccountRestoration } from "@/user/services/restoration";

/**
 * Controller endpoint to handle user identity profile state restoration requests.
 */
export const restoreAccount = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const authUserId = req.user?.id;
  const deviceToken = getOrSetDeviceToken(req, res);
  const userAgent = req.headers["user-agent"] || "unknown";

  if (!authUserId) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  try {
    const serviceResult = await executeAccountRestoration({
      authUserId,
      deviceToken,
      userAgent,
    });

    if (serviceResult.status === "NOT_FOUND") {
      return res.status(404).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("Account Restoration Error:", error);
    return forwardError(
      next,
      error.message
        ? MESSAGES_REGISTRY.AUTH.ACCOUNT_RESTORE_THROWN_ERROR(error.message)
        : MESSAGES_REGISTRY.AUTH.ACCOUNT_RESTORE_FALLBACK_ERROR,
      error,
    );
  }
};

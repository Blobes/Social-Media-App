import { NextFunction, Response } from "express";
import {
  IAuthRequest,
  MESSAGES_REGISTRY,
  clearAuthCookies,
  forwardError,
} from "@repo/shared";
import { executeEmailUpdateVerification } from "@/user/services/email";

/**
 * Controller endpoint to verify email ownership changes and sign out stale sessions.
 */
export const verifyEmailUpdate = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { code } = req.body as { code?: string };
  const userId = req.user?.id;
  const currentDeviceId = req.user?.deviceId;

  if (!userId) {
    res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
    return;
  }

  if (!code) {
    res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.CODE_REQUIRED,
      payload: null,
    });
    return;
  }

  try {
    const serviceResult = await executeEmailUpdateVerification({
      userId,
      currentDeviceId,
      code,
    });

    if (serviceResult.status === "NOT_FOUND") {
      res.status(404).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
      return;
    }

    if (
      serviceResult.status === "NO_PENDING_CHANGE" ||
      serviceResult.status === "NO_ACTIVE_PROCESS" ||
      serviceResult.status === "EXPIRED" ||
      serviceResult.status === "INVALID_CODE"
    ) {
      res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
      return;
    }

    // Nuke cookies immediately if identity update execution was forced from a non-primary link
    if (serviceResult.payload?.loggedOut) {
      clearAuthCookies(res);
    }

    res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
    return;
  } catch (error: any) {
    console.error("[verifyEmailUpdate] Error:", error);
    return forwardError(
      next,
      error.message
        ? MESSAGES_REGISTRY.AUTH.SERVER_THROWN_ERROR(error.message)
        : MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};

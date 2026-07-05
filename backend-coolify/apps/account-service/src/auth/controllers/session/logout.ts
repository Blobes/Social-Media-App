import { NextFunction, Response } from "express";
import {
  clearAuthCookies,
  forwardError,
  IAuthRequest,
  MESSAGES_REGISTRY,
} from "@repo/shared";
import { terminateUserSessions } from "@/auth/services/sessions/terminateSessions";

/**
 * Controller endpoint to handle incoming session termination and cookie clearance.
 */
export const logoutUser = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const userId = req.user?.id;
  const currentSessionId = req.user?.sessionId;
  const jwtDeviceId = req.user?.deviceId;

  const { targetDeviceId, logoutAll } = req.body as {
    targetDeviceId?: string;
    logoutAll?: boolean;
  };

  if (!userId) {
    return res.status(401).json({
      status: "UNAUTHORIZED",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  try {
    const serviceResult = await terminateUserSessions({
      userId,
      currentSessionId,
      jwtDeviceId,
      targetDeviceId,
      logoutAll,
    });

    if (serviceResult.shouldClearCookies) {
      clearAuthCookies(res);
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: {
        loggedOutLocally: serviceResult.shouldClearCookies,
      },
    });
  } catch (error: any) {
    console.error("Logout Processing Error:", error);
    return forwardError(
      next,
      error.message
        ? MESSAGES_REGISTRY.AUTH.SERVER_THROWN_ERROR(error.message)
        : MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};

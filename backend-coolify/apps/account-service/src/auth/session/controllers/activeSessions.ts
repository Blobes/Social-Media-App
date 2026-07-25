import { fetchActiveSessions } from "@/auth/session/services/activeSessions";
import { forwardError, IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import { NextFunction, Response } from "express";

/**
 * Controller endpoint to handle incoming requests for tracking and managing concurrent active user sessions.
 */
export const getActiveSessions = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const userId = req.user?.id;
  const currentSessionId = req.user?.sessionId;

  try {
    const serviceResult = await fetchActiveSessions(userId, currentSessionId);

    if (serviceResult.status === "UNAUTHORIZED") {
      return res.status(401).json({
        status: "UNAUTHORIZED",
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
    console.error("Get Active Sessions Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};

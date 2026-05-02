import {
  cleanUserSessions,
  clearAuthTokens,
  IAuthRequest,
  removeSession,
} from "@repo/shared";
import { Response } from "express";

/**
 * Terminates specific or all active sessions for a user and clears client-side tokens.
 */
export const logoutUser = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const userId = req.user?.id;
  const currentSessionId = req.user?.sessionId;
  const { targetSessionId, logoutAll } = req.body as {
    targetSessionId?: string;
    logoutAll?: boolean;
  };

  if (!userId) {
    return res.status(401).json({
      status: "UNAUTHORIZED",
      message: "Unauthorized",
      payload: null,
    });
  }

  try {
    if (logoutAll) {
      // Wipes all sessions across all devices for this user in Redis
      cleanUserSessions({ userId });
    } else {
      // Default to killing the current session if no specific ID is targeted
      const idToKill = targetSessionId || currentSessionId;
      if (idToKill) {
        removeSession(userId, idToKill);
      }
    }

    // Clear hardware-bound cookies if the current session is the one being terminated
    if (logoutAll || !targetSessionId || targetSessionId === currentSessionId) {
      clearAuthTokens(res);
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: logoutAll
        ? "Logged out from all devices successfully."
        : "Session terminated successfully.",
      payload: null,
    });
  } catch (error: any) {
    console.error("Logout Error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to process logout request.",
      payload: null,
    });
  }
};

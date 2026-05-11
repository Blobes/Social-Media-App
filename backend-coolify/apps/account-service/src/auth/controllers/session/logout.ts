import { Response } from "express";
import {
  cleanDeviceSessions,
  clearAuthTokens,
  IAuthRequest,
  removeSession,
} from "@repo/shared";

/**
 * Terminates sessions based on hardware identity or global wipe.
 */
export const logoutUser = async (
  req: IAuthRequest,
  res: Response,
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
      message: "Authentication context missing",
      payload: null,
    });
  }

  try {
    if (logoutAll) {
      // Wipes all sessions across every piece of hardware for this user
      await cleanDeviceSessions(userId, undefined, { clearAll: true });
    } else if (targetDeviceId) {
      // Terminates all sessions associated with a specific hardware ID
      await cleanDeviceSessions(userId, targetDeviceId);
    } else if (currentSessionId) {
      // Fallback: Terminate only the specific current session if no target device is provided
      await removeSession(userId, currentSessionId);
    }

    // Determine if we need to clear client-side cookies.
    const isCurrentDeviceTargeted = targetDeviceId === jwtDeviceId;
    const shouldClearCookies =
      logoutAll || isCurrentDeviceTargeted || !targetDeviceId;
    if (shouldClearCookies) {
      clearAuthTokens(res);
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: logoutAll
        ? "Successfully logged out of all devices."
        : "Device session(s) terminated successfully.",
      payload: {
        loggedOutLocally: shouldClearCookies,
      },
    });
  } catch (error: any) {
    console.error("Logout Processing Error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "An internal error occurred during logout.",
      payload: null,
    });
  }
};

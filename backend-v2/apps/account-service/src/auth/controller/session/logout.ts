import { IAuthRequest, invalidatePattern, redisClient } from "@repo/shared";
import { Response } from "express";

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
      status: "ERROR",
      message: "Unauthorized",
      payload: null,
    });
  }

  try {
    if (logoutAll) {
      // --- GLOBAL LOGOUT: Kill every session for this user ---
      // This uses the "Grenade" approach to clear all session keys in Upstash
      await invalidatePattern(`session:${userId}:*`);
    } else {
      // --- TARGETED LOGOUT: Kill a specific session ---
      // If no targetId is provided, we default to the current active session
      const idToKill = targetSessionId || currentSessionId;
      await redisClient.del(`session:${userId}:${idToKill}`);
    }

    // Clear cookies on the client side if the user is logging out of their current device
    if (logoutAll || !targetSessionId || targetSessionId === currentSessionId) {
      res.clearCookie("access_token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
      });
      res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
      });
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

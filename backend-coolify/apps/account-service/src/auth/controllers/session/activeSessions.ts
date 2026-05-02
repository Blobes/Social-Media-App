import { findUserSessions, IAuthRequest } from "@repo/shared";
import { Response } from "express";

/**
 * Retrieves all active sessions for the current user and flags the current device.
 */
export const getActiveSessions = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const userId = req.user?.id;
  const currentSessionId = req.user?.sessionId;

  if (!userId) {
    return res.status(401).json({ status: "ERROR", message: "Unauthorized" });
  }

  try {
    const allSessions = await findUserSessions(userId);

    const sessions = allSessions.map(({ sessionId, data }) => ({
      sessionId,
      deviceId: data.deviceId,
      isCurrentDevice: sessionId === currentSessionId,
      userAgent: data.userAgent,
      ip: data.ip,
      lastActive: data.lastActive,
      createdAt: data.createdAt,
    }));

    // Current device at the top of the list
    const sortedSessions = sessions.sort((a, b) =>
      a.isCurrentDevice === b.isCurrentDevice ? 0 : a.isCurrentDevice ? -1 : 1,
    );

    return res.status(200).json({
      status: "SUCCESS",
      message: "Active sessions retrieved.",
      payload: sortedSessions,
    });
  } catch (error) {
    console.error("Get Active Sessions Error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Could not retrieve active sessions.",
    });
  }
};

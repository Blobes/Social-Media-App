import { Response } from "express";
import { IAuthRequest, notifyUser } from "@repo/shared";

/**
 * Example Gateway Controller handling a real-time HTTP trigger.
 */
export const sendSystemNotification = async (
  req: IAuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { targetUserId, title, message } = req.body;

    // Dispatch real-time socket message to the target user's private room
    await notifyUser(targetUserId, "SYSTEM_NOTIFICATION", {
      title,
      message,
      sentAt: new Date().toISOString(),
      sentBy: req.user?.username,
    });

    res.status(200).json({
      success: true,
      message: `Notification dispatched successfully to user ${targetUserId}`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to dispatch socket event",
    });
  }
};

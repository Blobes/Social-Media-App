import { NextFunction, Response } from "express";
import { IAuthRequest, MESSAGES_REGISTRY, forwardError } from "@repo/shared";
import { updateNotificationSettings } from "./service";

/**
 * Controller endpoint to modify push, email, and quiet mode notification options.
 */
export const notificationSettingsController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
    return;
  }

  const { push, email, quietMode } = req.body;

  try {
    const serviceResult = await updateNotificationSettings({
      userId,
      push,
      email,
      quietMode,
    });

    if (serviceResult.status !== "SUCCESS") {
      res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
      return;
    }

    res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
    return;
  } catch (error: unknown) {
    console.error("[updateNotificationSettingsController] Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.SETTINGS.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};

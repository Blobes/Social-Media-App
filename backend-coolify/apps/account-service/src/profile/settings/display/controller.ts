import { NextFunction, Response } from "express";
import { IAuthRequest, MESSAGES_REGISTRY, forwardError } from "@repo/shared";
import { updateDisplaySettings } from "./service";

/**
 * Controller endpoint to modify display preferences, accessibility, and localization.
 */
export const displayAndAppSettingsController = async (
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

  const { theme, showSensitiveMedia, accessibility, localization } = req.body;

  try {
    const serviceResult = await updateDisplaySettings({
      userId,
      theme,
      showSensitiveMedia,
      accessibility,
      localization,
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
    console.error("[updateDisplayAndAppSettingsController] Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.SETTINGS.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};

import { NextFunction, Response } from "express";
import {
  IAuthRequest,
  MESSAGES_REGISTRY,
  forwardError,
  fetchUserSettings,
} from "@repo/shared";
import { UpdateSettingsInput, updateUserSettings } from "./service";

/**
 * Controller endpoint to fetch active user settings.
 */
export const getUserSettings = async (
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

  try {
    const settingsResult = await fetchUserSettings({ userId });

    if (!settingsResult) {
      res.status(400).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.SETTINGS.SETTINGS_NOT_FOUND,
        payload: null,
      });
    }

    res.status(200).json({
      status: "SUCCESS",
      ...MESSAGES_REGISTRY.SETTINGS.FETCHED_SUCCESSFULLY,
      payload: settingsResult,
    });
    return;
  } catch (error: any) {
    console.error("[fetchUserSettings] Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.SETTINGS.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};

/**
 * Controller endpoint to modify granular settings and preferences.
 */
export const modifyUserSettings = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.id;
  const settingsInput = req.body as UpdateSettingsInput;

  if (!userId) {
    res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
    return;
  }

  if (!settingsInput || Object.keys(settingsInput).length === 0) {
    res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.SETTINGS.EMPTY_UPDATE_PAYLOAD,
      payload: null,
    });
    return;
  }

  try {
    const serviceResult = await updateUserSettings({
      userId,
      settings: settingsInput,
    });

    res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
    return;
  } catch (error: any) {
    console.error("[modifyUserSettings] Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.SETTINGS.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};

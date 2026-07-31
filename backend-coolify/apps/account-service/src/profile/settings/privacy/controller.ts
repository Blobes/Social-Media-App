import { NextFunction, Response } from "express";
import { IAuthRequest, MESSAGES_REGISTRY, forwardError } from "@repo/shared";
import { updatePrivacySettings } from "./service";

/**
 * Controller endpoint to modify user privacy configurations.
 */
export const privacySettingsController = async (
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

  const {
    isPrivateAccount,
    discoverability,
    directMessaging,
    mentionsAndTagging,
  } = req.body;

  try {
    const serviceResult = await updatePrivacySettings({
      userId,
      isPrivateAccount,
      discoverability,
      directMessaging,
      mentionsAndTagging,
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
    console.error("[updatePrivacySettingsController] Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.SETTINGS.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};

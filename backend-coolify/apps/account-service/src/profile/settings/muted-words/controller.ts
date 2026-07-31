import { NextFunction, Response } from "express";
import { IAuthRequest, MESSAGES_REGISTRY, forwardError } from "@repo/shared";
import { addMutedWords, removeMutedWords } from "./service";

/**
 * Controller endpoint to add words to the user's content mute filter.
 */
export const addMutedWordsHandler = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.id;
  const { words } = req.body as { words?: string[] };

  if (!userId) {
    res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
    return;
  }

  if (!words || !Array.isArray(words) || words.length === 0) {
    res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.SETTINGS.INVALID_MUTED_WORDS_PAYLOAD,
      payload: null,
    });
    return;
  }

  try {
    const serviceResult = await addMutedWords({ userId, words });

    if (serviceResult.status === "INVALID_INPUT") {
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
  } catch (error: any) {
    console.error("[addMutedWordsHandler] Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.SETTINGS.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};

/**
 * Controller endpoint to remove words from the user's content mute filter.
 */
export const removeMutedWordsHandler = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.id;
  const { words } = req.body as { words?: string[] };

  if (!userId) {
    res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
    return;
  }

  if (!words || !Array.isArray(words) || words.length === 0) {
    res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.SETTINGS.INVALID_MUTED_WORDS_PAYLOAD,
      payload: null,
    });
    return;
  }

  try {
    const serviceResult = await removeMutedWords({ userId, words });

    res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
    return;
  } catch (error: any) {
    console.error("[removeMutedWordsHandler] Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.SETTINGS.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};

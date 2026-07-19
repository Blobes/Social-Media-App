import { Response, NextFunction } from "express";
import {
  executeTopicUpdate,
  forwardError,
  IAuthRequest,
  MESSAGES_REGISTRY,
} from "@repo/shared";

interface ManageRequest extends IAuthRequest {
  body: {
    topics: string[];
    targetId?: string;
    targetModel?: "Gist" | "Stake" | "User";
    actionType:
      | "USER_PREFERENCE"
      | "POST_CREATION_OR_UPDATE"
      | "POST_ENGAGEMENT";
  };
}

/**
 * Controller endpoint processing ingestion configurations to match up taxonomy tags safely against target updates.
 */
export const manageTopics = async (
  req: ManageRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const userId = req.user?.id;
  const { topics, targetId, targetModel, actionType } = req.body;

  if (!userId) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  try {
    const serviceResult = await executeTopicUpdate({
      topics,
      userId,
      targetId,
      targetModel,
      actionType,
    });

    if (serviceResult.status === "INVALID_INPUT") {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error(
      `[Topic Manager] Execution Instance Failure during ${actionType}:`,
      error,
    );

    return forwardError(
      next,
      error.message
        ? MESSAGES_REGISTRY.POST.POST_TOPICS_UPDATE_THROWN_ERROR(error.message)
        : MESSAGES_REGISTRY.POST.POST_TOPICS_UPDATE_FALLBACK_ERROR,
      error,
    );
  }
};

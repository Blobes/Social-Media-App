import { Response } from "express";
import { IAuthRequest } from "../../types";
import { executeTopicUpdate } from "../../services/topic";

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
 * Orchestrates topic creation, on user preference settings, post creation and post engagement.
 */
export const manageTopics = async (
  req: ManageRequest,
  res: Response,
): Promise<any> => {
  const userId = req.user?.id;
  const { topics, targetId, targetModel, actionType } = req.body;

  if (!topics || !Array.isArray(topics) || topics.length === 0) {
    return res.status(400).json({
      status: "ERROR",
      message: "A list of topics is required.",
    });
  }

  try {
    await executeTopicUpdate({
      topics,
      userId,
      targetId,
      targetModel,
      actionType,
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Topics processed successfully",
    });
  } catch (error: any) {
    console.error(`[Topic Manager] Error during ${actionType}:`, error);
    return res.status(500).json({
      status: "ERROR",
      message: error.message || "Internal server error",
    });
  }
};

import {
  forwardError,
  IAuthRequest,
  MESSAGES_REGISTRY,
  removeTopicsFromUser,
} from "@repo/shared";
import { Response, NextFunction } from "express";

interface RemovalRequest extends IAuthRequest {
  body: {
    topicIds: string[];
  };
}

/**
 * Controller endpoint stripping tracking indices off a specific user profile choice collection.
 */
export const removeUserTopics = async (
  req: RemovalRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const userId = req.user?.id;
  const { topicIds } = req.body;

  if (!userId) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  try {
    const serviceResult = await removeTopicsFromUser(userId, topicIds);

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
      payload: null,
    });
  } catch (error: any) {
    console.error(
      "Taxonomy Disassociation Processing Instance Failure:",
      error,
    );

    return forwardError(
      next,
      MESSAGES_REGISTRY.POST.POST_USER_TOPICS_REMOVAL_FALLBACK_ERROR,
      error,
    );
  }
};

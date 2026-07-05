// User-triggered Removal: Receives a list of topics to be removed from a user's preferred topics list and decrement the userCount field from the topic collection.

// Automated-removal: A background process that looks into the user's preferred topics list and removes every topic that the lastViewed date exceeds a given number when compared with the current date. And also decrements the userCount field from the topic collection.

import { Response, NextFunction } from "express";
import { IAuthRequest } from "../../types";
import { MESSAGES_REGISTRY } from "../../constants/msgRegistry";
import { removeTopicsFromUser } from "../../services/topic";
import { forwardError } from "../../utils/misc/error";

interface RemovalRequest extends IAuthRequest {
  body: {
    topicIds: string[];
  };
}

/**
 * Controller endpoint stripping tracking indices off a specific user profile choice collection.
 */
export const handleUserTopicRemoval = async (
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
      error.message
        ? MESSAGES_REGISTRY.POST.POST_USER_TOPICS_REMOVAL_THROWN_ERROR(
            error.message,
          )
        : MESSAGES_REGISTRY.POST.POST_USER_TOPICS_REMOVAL_FALLBACK_ERROR,
      error,
    );
  }
};

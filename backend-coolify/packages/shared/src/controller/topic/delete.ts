import { Response, NextFunction } from "express";
import { IAuthRequest } from "../../types";
import { pruneDeadTopics } from "../../services/topic";
import { forwardError } from "../../utils/misc/error";
import { MESSAGES_REGISTRY } from "../../constants/msgRegistry";

interface DeleteRequest extends IAuthRequest {
  body: {
    topicIds: string[];
  };
}

/**
 * Controller endpoint processing administrative criteria to wipe orphaned or unused taxonomy indices.
 */
export const deleteUnusedTopics = async (
  req: DeleteRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const { topicIds } = req.body;

  try {
    const serviceResult = await pruneDeadTopics(topicIds);

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
    console.error("Taxonomy Prune Processing Instance Failure:", error);

    return forwardError(
      next,
      error.message
        ? MESSAGES_REGISTRY.POST.POST_TOPICS_PRUNED_THROWN_ERROR(error.message)
        : MESSAGES_REGISTRY.POST.POST_TOPICS_PRUNED_FALLBACK_ERROR,
      error,
    );
  }
};

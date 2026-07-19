import {
  forwardError,
  IAuthRequest,
  MESSAGES_REGISTRY,
  pruneDeadTopics,
} from "@repo/shared";
import { Response, NextFunction } from "express";

/**
 * Controller endpoint processing administrative criteria to wipe orphaned or unused taxonomy indices.
 */
export const deleteUnusedTopics = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const serviceResult = await pruneDeadTopics();

    if (serviceResult.status === "SERVER_ERROR") {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.deletedCount,
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

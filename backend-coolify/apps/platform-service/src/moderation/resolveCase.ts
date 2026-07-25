import { NextFunction, Response } from "express";
import {
  IAuthRequest,
  MESSAGES_REGISTRY,
  PostType,
  executeCaseResolution,
  forwardError,
} from "@repo/shared";
import {
  CaseResolutionAction,
  ModerationCategory,
  ModerationDecision,
  ModeratorType,
} from "@repo/database";

interface IResolveCaseRequestBody {
  flagId: string;
  resolution: CaseResolutionAction;
  decisionType: ModerationDecision;
  postType?: PostType;
  resolvedByType?: ModeratorType;
  category?: ModerationCategory;
  reasonNote?: string;
}

/**
 * Controller endpoint to handle cross-scenario administrative case evaluation closures.
 */
export const resolveCase = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const {
    flagId,
    resolution,
    decisionType,
    postType,
    resolvedByType,
    category,
    reasonNote,
  } = req.body as IResolveCaseRequestBody;
  const authUserId = req.user?.id;
  const userRole = req.user?.role;

  if (!authUserId || userRole !== "ADMIN") {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  try {
    const serviceResult = await executeCaseResolution({
      caseId: flagId,
      resolution,
      decisionType,
      postType,
      resolvedByType,
      category,
      reasonNote,
      moderatorId: authUserId,
    });

    if (serviceResult.status !== "SUCCESS") {
      return res.status(404).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...MESSAGES_REGISTRY.ADMIN.MODERATION_CASE_RESOLVED,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("Moderation Case Resolution Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.ADMIN.MODERATION_RESOLUTION_FALLBACK_ERROR,
      error,
    );
  }
};

import { Response, NextFunction } from "express";
import { IAuthRequest, MESSAGES_REGISTRY, forwardError } from "@repo/shared";
import { executeGetUserDraftPosts } from "../services/drafts";
/**
 * Controller endpoint to retrieve the private collection of unpublished draft posts belonging strictly to the authenticated user.
 */
export const getUserDraftPosts = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const targetUserId = req.params.id as string;
  const authUserId = req.user?.id;

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const serviceResult = await executeGetUserDraftPosts({
      targetUserId,
      authUserId,
      page,
      limit,
    });

    if (serviceResult.status === "INVALID_ID") {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: serviceResult.payload,
      });
    }

    if (serviceResult.status === "FORBIDDEN") {
      return res.status(403).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: serviceResult.payload,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
      meta: serviceResult.meta,
    });
  } catch (error: any) {
    console.error("[getUserDraftPosts] Error:", error);

    return forwardError(
      next,
      error.message
        ? MESSAGES_REGISTRY.POST.USER_DRAFTS_THROWN_ERROR(error.message)
        : MESSAGES_REGISTRY.POST.USER_DRAFTS_FALLBACK_ERROR,
      error,
    );
  }
};

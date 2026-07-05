import { Response, NextFunction } from "express";
import { IAuthRequest, MESSAGES_REGISTRY, forwardError } from "@repo/shared";
import { executeGetAllPost } from "../services/getAllPosts";

/**
 * Controller endpoint to handle fetching operations for the personalized global feed timeline.
 */
export const getAllPost = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const userId = req.user?.id;

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const serviceResult = await executeGetAllPost({
      userId,
      page,
      limit,
      userContext: req.user,
    });

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
      meta: serviceResult.meta,
    });
  } catch (error: any) {
    console.error("[getAllPost] Error:", error);
    return forwardError(
      next,
      error.message
        ? MESSAGES_REGISTRY.POST.GLOBAL_FEED_THROWN_ERROR(error.message)
        : MESSAGES_REGISTRY.POST.GLOBAL_FEED_FALLBACK_ERROR,
      error,
    );
  }
};

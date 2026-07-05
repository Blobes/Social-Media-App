import { Response, NextFunction } from "express";
import { IAuthRequest, MESSAGES_REGISTRY, forwardError } from "@repo/shared";
import { executeGetUserPosts } from "../services/userPosts";

/**
 * Controller endpoint to handle fetching all posts for a specific user profile with high-speed caching.
 */
export const getUserPosts = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const targetUserId = req.params.id as string;
  const authUserId = req.user?.id;

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const serviceResult = await executeGetUserPosts({
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

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
      meta: serviceResult.meta,
    });
  } catch (error: any) {
    console.error("[getUserPosts] Error:", error);

    return forwardError(
      next,
      error.message
        ? MESSAGES_REGISTRY.POST.USER_POSTS_THROWN_ERROR(error.message)
        : MESSAGES_REGISTRY.POST.USER_POSTS_FALLBACK_ERROR,
      error,
    );
  }
};

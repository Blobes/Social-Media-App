import { Response, NextFunction } from "express";
import { IAuthRequest, MESSAGES_REGISTRY, forwardError } from "@repo/shared";
import { executeGetFollowersPosts } from "../services/followers";

/**
 * Controller endpoint to handle paginated timeline fetching requests for followed content streams.
 */
export const getFollowersPosts = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const authUserId = req.user?.id;

  if (!authUserId) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;

    const serviceResult = await executeGetFollowersPosts({
      authUserId,
      page,
      limit,
      userContext: req.user,
    });

    if (serviceResult.status === "EMPTY_FEED") {
      return res.status(200).json({
        status: "SUCCESS",
        ...serviceResult.transInfo,
        payload: serviceResult.payload,
        meta: serviceResult.meta,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
      meta: serviceResult.meta,
    });
  } catch (error: any) {
    console.error("[getFollowersPosts] Error:", error);

    // Explicitly utilizing direct forwardError mapping per execution design requirements
    return forwardError(
      next,
      error.message
        ? MESSAGES_REGISTRY.POST.FOLLOWERS_FEED_THROWN_ERROR(error.message)
        : MESSAGES_REGISTRY.POST.FOLLOWERS_FEED_FALLBACK_ERROR,
      error,
    );
  }
};

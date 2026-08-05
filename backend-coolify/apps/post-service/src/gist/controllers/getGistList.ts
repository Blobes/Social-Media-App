import { Response, NextFunction } from "express";
import { IAuthRequest, MESSAGES_REGISTRY, forwardError } from "@repo/shared";
import { executeGetGistList } from "../services/gistList";

/**
 * Controller endpoint processing request constraints to resolve and paginate global content feed listing metrics.
 */
export const getGistList = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const userId = req.user?.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  try {
    const serviceResult = await executeGetGistList({
      userId,
      page,
      limit,
    });

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
      meta: serviceResult.meta,
    });
  } catch (error: any) {
    console.error("Fetch Gists List Error Details:", error);

    return forwardError(
      next,
      MESSAGES_REGISTRY.POST.CREATION_FALLBACK_ERROR("Gist"),
      error,
    );
  }
};

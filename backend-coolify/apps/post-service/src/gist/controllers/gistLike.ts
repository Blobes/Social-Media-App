import { NextFunction, Response } from "express";
import { forwardError, IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import { executeGistLike } from "../services/gistLike";

/**
 * Controller endpoint processing traffic criteria to track and switch like engagement details.
 */
export const gistLike = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const gistId = req.params.id as string;
  const userId = req.user?.id;

  try {
    const serviceResult = await executeGistLike({
      gistId,
      userId,
    });

    if (serviceResult.status === "INVALID_SESSION") {
      return res.status(401).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: serviceResult.payload,
      });
    }

    if (serviceResult.status === "INVALID_ID") {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: serviceResult.payload,
      });
    }

    if (serviceResult.status === "NOT_FOUND") {
      return res.status(404).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: serviceResult.payload,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("Like Gist Error:", error);

    return forwardError(
      next,
      MESSAGES_REGISTRY.POST.POST_LIKE_FALLBACK_ERROR("Gist"),
      error,
    );
  }
};

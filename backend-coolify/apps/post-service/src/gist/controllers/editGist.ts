import { Response, NextFunction } from "express";
import { IAuthRequest, MESSAGES_REGISTRY, forwardError } from "@repo/shared";
import { FUNSTAKES_REDIS_URL } from "@/envVars";
import { executeEditGist } from "../services/editGist";

interface EditRequest extends IAuthRequest {
  body: {
    caption: string;
    postId: string;
  };
}

/**
 * Controller endpoint to delegate content adjustments and process stream pipeline registration hooks.
 */
export const editGist = async (
  req: EditRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const userId = req.user?.id;
  const { caption, postId: gistId } = req.body;

  try {
    const serviceResult = await executeEditGist({
      userId,
      gistId,
      caption,
      redisUrl: FUNSTAKES_REDIS_URL,
    });

    if (
      serviceResult.status === "CONTENT_REQUIRED" ||
      serviceResult.status === "INVALID_SESSION"
    ) {
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

    if (serviceResult.status === "PERMISSION_DENIED") {
      return res.status(403).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: serviceResult.payload,
      });
    }

    if (serviceResult.status === "LIMIT_REACHED") {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: serviceResult.payload,
      });
    }

    return res.status(202).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("Critical Edit Error:", error);

    return forwardError(
      next,
      MESSAGES_REGISTRY.POST.UPDATE_MODERATION_STREAM_FAILED("Gist"),
      error,
    );
  }
};

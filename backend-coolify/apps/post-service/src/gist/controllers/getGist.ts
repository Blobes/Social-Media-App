import { Response, NextFunction } from "express";
import {
  IAuthRequest,
  MESSAGES_REGISTRY,
  forwardError,
  PostType,
} from "@repo/shared";
import { executeGetGist } from "../services/getGist";

/**
 * Controller endpoint managing request routing configurations for collecting and hydrating specific gist profiles.
 */
export const getGist = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const postId = req.params.id as string;
  const userId = req.user?.id;

  try {
    const serviceResult = await executeGetGist({
      postId,
      userId,
    });

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
    console.error("Get Gist Error:", error);

    return forwardError(
      next,
      error.message
        ? MESSAGES_REGISTRY.POST.CREATION_THROWN_ERROR(error.message, "Gist")
        : MESSAGES_REGISTRY.POST.CREATION_FALLBACK_ERROR("Gist"),
      error,
    );
  }
};

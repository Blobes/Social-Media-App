import { Response, NextFunction } from "express";
import {
  IAuthRequest,
  MESSAGES_REGISTRY,
  forwardError,
  MsgPostType,
  PostType,
} from "@repo/shared";
import { executeMarkPostAsSeen } from "./service";

/**
 * Controller endpoint managing traffic routing parameters for updating engagement tracking counters across unique digital post artifacts.
 */
export const markPostAsSeen = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const { postType } = req.body as { postType: PostType };
  const userId = req.user?.id;
  const postId = String(req.params?.postId);

  const msgPostType: MsgPostType = postType === "GIST" ? "Gist" : "Stake";

  try {
    const serviceResult = await executeMarkPostAsSeen({
      postId,
      userId,
      postType,
      msgPostType,
    });

    if (serviceResult.status === "INVALID_SESSION") {
      return res.status(401).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: serviceResult.payload,
      });
    }

    if (serviceResult.status === "INVALID_TYPE") {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: serviceResult.payload,
      });
    }

    if (serviceResult.status === "SUCCESS_ALREADY_RECORDED") {
      return res.status(200).json({
        status: "SUCCESS",
        ...serviceResult.transInfo,
        payload: serviceResult.payload,
      });
    }

    const statusCode =
      serviceResult.status === "SUCCESS_VIEW_RECORDED" ? 201 : 200;

    return res.status(statusCode).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error(`[markPostAsSeen] Error:`, error);

    return forwardError(
      next,
      MESSAGES_REGISTRY.POST.CREATION_FALLBACK_ERROR(msgPostType),
      error,
    );
  }
};

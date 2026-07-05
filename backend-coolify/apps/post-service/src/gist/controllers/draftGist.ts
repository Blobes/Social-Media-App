import { Response, NextFunction } from "express";
import { getClientIp, MESSAGES_REGISTRY, forwardError } from "@repo/shared";
import { executeDraftPost } from "@/shared/services/draft";
import { CreateRequest } from "./createGist";

export interface DraftRequest extends CreateRequest {
  body: {
    gistId?: string;
    caption?: string;
    topics?: string[];
  };
}

/**
 * Controller endpoint to persist draft tracking layers by modifying old structures or instantiating unique workspace records.
 */
export const draftGist = async (
  req: DraftRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const userId = req.user?.id;
  const { gistId, caption, topics } = req.body;
  const postType = "GIST";
  const msgPostType = "Gist";

  // Preserving client networking lookup logic layer unchanged
  const userIp = getClientIp(req);

  try {
    const serviceResult = await executeDraftPost({
      userId,
      postId: gistId,
      caption,
      topics,
      postType,
      msgPostType,
    });

    if (serviceResult.status === "INVALID_SESSION") {
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

    const statusCode = serviceResult.status === "SUCCESS_UPDATED" ? 200 : 201;

    return res.status(statusCode).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error(`[draft${postType}] Error:`, error);

    return forwardError(
      next,
      error.message
        ? MESSAGES_REGISTRY.POST.DRAFT_THROWN_ERROR(error.message, msgPostType)
        : MESSAGES_REGISTRY.POST.DRAFT_FALLBACK_ERROR(msgPostType),
      error,
    );
  }
};

import { Response, RequestHandler, NextFunction } from "express";
import { forwardError, IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import { executeEmailChangeCancellation } from "@/user/services/email";

/**
 * Controller endpoint to terminate ongoing email update pipelines.
 */
export const cancelEmailChange: RequestHandler = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
    return;
  }

  try {
    const serviceResult = await executeEmailChangeCancellation({ userId });

    if (serviceResult.status === "NOT_FOUND") {
      res.status(404).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
      return;
    }

    if (serviceResult.status === "NO_PENDING_CHANGE") {
      res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
      return;
    }

    res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: null,
    });
    return;
  } catch (error: any) {
    console.error("Email Change Cancellation Error:", error);
    return forwardError(
      next,
      error.message
        ? MESSAGES_REGISTRY.AUTH.UPDATE_CANCELLATION_THROWN_ERROR(error.message)
        : MESSAGES_REGISTRY.AUTH.UPDATE_CANCELLATION_FALLBACK_ERROR,
      error,
    );
  }
};

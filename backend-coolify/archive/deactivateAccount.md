import { NextFunction, Response } from "express";
import {
  IAuthRequest,
  MESSAGES_REGISTRY,
  clearAuthCookies,
  forwardError,
} from "@repo/shared";
import { executeAccountDeactivation } from "@/profile/account/services/deactivation";

/**
 * Controller endpoint to deactivate accounts and strip active user environments.
 */
export const deactivateAccount = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const { targetId } = req.body as { targetId?: string };
  const authUserId = req.user?.id;
  const userRole = req.user?.role;

  if (!authUserId) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  try {
    const isDeactivatingSelf = !targetId || targetId === authUserId;
    const finalIdToProcess = isDeactivatingSelf
      ? authUserId
      : (targetId as string);

    if (!isDeactivatingSelf && userRole !== "ADMIN") {
      return res.status(403).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.AUTH.FORBIDDEN,
        payload: null,
      });
    }

    const serviceResult = await executeAccountDeactivation({
      finalIdToProcess,
    });

    if (serviceResult.status !== "SUCCESS") {
      return res.status(serviceResult.status === "NOT_FOUND" ? 404 : 400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    // Flush active cookies if client requested self deactivation
    if (isDeactivatingSelf) {
      clearAuthCookies(res);
    }

    const transMsg = isDeactivatingSelf
      ? MESSAGES_REGISTRY.AUTH.ACCOUNT_DEACTIVATED_SELF
      : MESSAGES_REGISTRY.AUTH.ACCOUNT_DEACTIVATED_ADMIN;

    return res.status(200).json({
      status: "SUCCESS",
      ...transMsg,
      payload: null,
    });
  } catch (error: any) {
    console.error("Soft Delete Error:", error);
    return forwardError(
      next,
      error.message
        ? MESSAGES_REGISTRY.AUTH.ACCOUNT_STATUS_CHANGE_THROWN_ERROR(
            error.message,
          )
        : MESSAGES_REGISTRY.AUTH.DEACTIVATION_FALLBACK_ERROR,
      error,
    );
  }
};

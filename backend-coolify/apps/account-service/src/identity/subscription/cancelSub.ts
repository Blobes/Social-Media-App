import { NextFunction, Response } from "express";
import { forwardError, IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import { SubscriptionService } from "@repo/security";

/**
 * Controller endpoint to schedule subscription cancellation at period end.
 */
export const cancelSubscription = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  try {
    const updatedSubscription =
      await SubscriptionService.cancelSubscriptionAtPeriodEnd(userId);

    return res.status(200).json({
      status: "SUCCESS",
      ...MESSAGES_REGISTRY.SYSTEM.SUBSCRIPTION_CANCELLED,
      payload: updatedSubscription,
    });
  } catch (error: unknown) {
    console.error("Cancel Subscription Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};

import { NextFunction, Response } from "express";
import { forwardError, IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import { SubscriptionService } from "@repo/security";

/**
 * Controller endpoint to retrieve current subscription status for an authenticated user.
 */
export const getMySubscription = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  try {
    const subscription = await SubscriptionService.getByUserId(userId);

    if (!subscription) {
      return res.status(404).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.SYSTEM.SUBSCRIPTION_NOT_FOUND,
        payload: null,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...MESSAGES_REGISTRY.SYSTEM.SUBSCRIPTION_FETCHED,
      payload: subscription,
    });
  } catch (error: any) {
    console.error("Fetch Subscription Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};

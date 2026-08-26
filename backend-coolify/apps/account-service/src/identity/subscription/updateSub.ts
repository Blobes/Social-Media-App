import { NextFunction, Response } from "express";
import { SubscriptionTier } from "@repo/database";
import { forwardError, IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import { SubscriptionService } from "@repo/security";

/**
 * Controller endpoint to request a subscription tier update/upgrade.
 */
export const updateSubscriptionTier = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  const userId = req.user?.id;
  const { tier } = req.body as { tier: SubscriptionTier };

  if (!userId) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  if (!tier || !["FREE", "PREMIUM", "ENTERPRISE"].includes(tier)) {
    return res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.SYSTEM.SUBSCRIPTION_INVALID_TYPE,
      payload: null,
    });
  }

  try {
    const result = await SubscriptionService.updateSubscription(userId, {
      tier,
      status: "ACTIVE",
    });

    if (result.status === "INELIGIBLE") {
      return res.status(403).json({
        status: "ERROR",
        ...result.transInfo,
        payload: null,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...result.transInfo,
      payload: result.subscription,
    });
  } catch (error: unknown) {
    console.error("Update Subscription Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};

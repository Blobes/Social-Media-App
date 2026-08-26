import { NextFunction, Response } from "express";
import { forwardError, IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import { SubscriptionService } from "@repo/security";

/**
 * Controller endpoint handling incoming Stripe/Payment Gateway Webhooks.
 */
export const handleSubscriptionWebhook = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  const { eventType, customerId, subscriptionId, status, tier } = req.body;

  try {
    switch (eventType) {
      case "customer.subscription.updated":
      case "customer.subscription.created":
        await SubscriptionService.syncExternalSubscription(customerId, {
          stripeSubscriptionId: subscriptionId,
          status,
          tier,
        });
        break;

      case "customer.subscription.deleted":
        const sub = await SubscriptionService.getByStripeCustomerId(customerId);
        if (sub) {
          await SubscriptionService.downgradeToFree(sub.userId.toString());
        }
        break;

      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (error: unknown) {
    console.error("Webhook Processing Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};

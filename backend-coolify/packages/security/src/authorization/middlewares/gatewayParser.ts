// @repo/security/src/middleware/gateway.middleware.ts

import { NextFunction, Request, Response } from "express";
import { SubscriptionStatus, SubscriptionTier } from "@repo/database";
import { IAuthRequest } from "@repo/shared";

/**
 * Parses stateless identity headers attached by the API Gateway
 * and populates req.authContext for downstream route handlers.
 */
export const parseGatewayHeaders = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const userId = req.headers["x-user-id"] as string;
  const rawRoles = req.headers["x-user-roles"] as string;

  if (!userId) {
    return next();
  }

  try {
    const roles = rawRoles ? JSON.parse(rawRoles) : [];
    const subscriptionTier =
      (req.headers["x-subscription-tier"] as SubscriptionTier) || "FREE";
    const subscriptionStatus =
      (req.headers["x-subscription-status"] as SubscriptionStatus) || "ACTIVE";

    const isPremium =
      (subscriptionTier === "PREMIUM" || subscriptionTier === "ENTERPRISE") &&
      (subscriptionStatus === "ACTIVE" || subscriptionStatus === "TRIALING");

    (req as IAuthRequest).authContext = {
      userId,
      email: (req.headers["x-user-email"] as string) || "",
      roles,
      subscriptionTier,
      subscriptionStatus,
      isPremium,
      deviceId: (req.headers["x-device-id"] as string) || null,
      sessionId: (req.headers["x-session-id"] as string) || null,
    };
  } catch {
    (req as IAuthRequest).authContext = undefined;
  }
  return next();
};

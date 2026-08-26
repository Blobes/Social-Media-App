import { NextFunction, Response } from "express";
import { PermissionName, RoleName, SubscriptionTier } from "@repo/database";
import {
  IAuthRequest,
  IBaseResource,
  IPolicy,
  MESSAGES_REGISTRY,
  TIER_WEIGHTS,
} from "@repo/shared";
import { AuthorizationService } from "../services/authorize";

/**
 * Restricts route access based on minimum required subscription tier and active subscription status.
 */
export const requireSubscription = (requiredTier: SubscriptionTier) => {
  return (
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): Response | void => {
    const context = req.authContext;

    if (!context) {
      return res.status(401).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
        payload: null,
      });
    }

    const currentStatus = context.subscriptionStatus ?? "ACTIVE";
    const isSubscriptionActive =
      currentStatus === "ACTIVE" || currentStatus === "TRIALING";

    const userTierWeight = TIER_WEIGHTS[context.subscriptionTier ?? "FREE"];
    const requiredTierWeight = TIER_WEIGHTS[requiredTier];

    const hasRequiredTier = userTierWeight >= requiredTierWeight;

    if (!isSubscriptionActive || !hasRequiredTier) {
      return res.status(403).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.SYSTEM.POLICY_REQUIREMENT_FAILED,
        payload: null,
      });
    }

    return next();
  };
};

/**
 * Restricts route access based on explicit roles.
 */
export const requireRole = (allowedRoles: RoleName[]) => {
  return (
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): Response | void => {
    const context = req.authContext;

    if (!context) {
      return res.status(401).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
        payload: null,
      });
    }

    const hasAllowedRole = context.roles.some((role) =>
      allowedRoles.includes(role as RoleName),
    );

    if (!hasAllowedRole) {
      return res.status(403).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.SYSTEM.INSUFFICIENT_ROLE_PERMISSIONS,
        payload: null,
      });
    }
    return next();
  };
};

/**
 * Restricts route access based on granular permission flags.
 */
export const requirePermission = (requiredPermission: PermissionName) => {
  return (
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): Response | void => {
    const context = req.authContext;

    if (!context) {
      return res.status(401).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
        payload: null,
      });
    }

    const isAllowed = AuthorizationService.hasPermission(
      context,
      requiredPermission,
    );

    if (!isAllowed) {
      return res.status(403).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.SYSTEM.POLICY_REQUIREMENT_FAILED,
        payload: null,
      });
    }

    return next();
  };
};

/**
 * Enforces dynamic ReBAC authorization policies using strongly-typed policy evaluators.
 */
export const enforcePolicy = <T extends IBaseResource>(
  policy: IPolicy<T>,
  getResource?: (req: IAuthRequest) => Promise<T> | T,
) => {
  return async (
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const context = req.authContext;

      if (!context) {
        return res.status(401).json({
          status: "ERROR",
          ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
          payload: null,
        });
      }

      // Resolve resource if fetcher callback is provided
      const resource = getResource ? await getResource(req) : ({} as T);

      // Policy directly handles evaluation logic
      const isAllowed = await policy.evaluate(context, resource);

      if (!isAllowed) {
        return res.status(403).json({
          status: "ERROR",
          ...MESSAGES_REGISTRY.SYSTEM.POLICY_REQUIREMENT_FAILED,
          payload: null,
        });
      }

      return next();
    } catch (error: unknown) {
      return next(error);
    }
  };
};

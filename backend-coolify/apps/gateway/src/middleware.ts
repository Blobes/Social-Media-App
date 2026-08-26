import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import { IAuthRequest, IJwtUser, MESSAGES_REGISTRY } from "@repo/shared";

/**
 * Gateway-level authentication middleware.
 * Verifies JWT signature statelessly at the edge and attaches forwarded user claims to headers.
 */
export const gatewayAuthMiddleware = (jwtSecret: string) => {
  return (req: IAuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    const token =
      req.cookies?.access_token ||
      (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);

    if (!token) {
      res.status(401).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.AUTH.AUTH_REQUIRED,
        payload: null,
      });
      return;
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as IJwtUser;
      req.user = decoded;

      // Attach stateless identity claims for downstream microservices
      req.headers["x-user-id"] = String(decoded.id);
      req.headers["x-user-email"] = decoded.email || "";
      req.headers["x-user-roles"] = JSON.stringify(decoded.roles || []);

      // Forward subscription claims to downstream services
      req.headers["x-subscription-tier"] = decoded.subscriptionTier || "FREE";
      req.headers["x-subscription-status"] =
        decoded.subscriptionStatus || "ACTIVE";

      if (decoded.deviceId) req.headers["x-device-id"] = decoded.deviceId;
      if (decoded.sessionId) req.headers["x-session-id"] = decoded.sessionId;

      next();
    } catch {
      res.status(401).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.AUTH.INVALID_TOKEN,
        payload: null,
      });
      return;
    }
  };
};

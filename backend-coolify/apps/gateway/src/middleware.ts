import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import { IAuthRequest, IJwtUser } from "@repo/shared";

/**
 * Gateway-level identity forwarding middleware.
 * Decodes JWTs when present to inject identity headers for downstream microservices without blocking unauthenticated requests.
 */
export const forwardIdHeaders = (jwtSecret: string) => {
  return (req: IAuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    const token =
      req.cookies?.access_token ||
      (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);

    if (!token) return next();

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
    } catch {
      // Allow request to proceed unauthenticated if token verification fails; downstream services will handle strict enforcement
    }
    next();
  };
};

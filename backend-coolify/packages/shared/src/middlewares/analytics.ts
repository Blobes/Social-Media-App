import { Response, NextFunction } from "express";
import { IAuthRequest } from "../types/general";
import { trackEvent } from "../services/analytics";

/**
 * Intercepts outbound responses to asynchronously record user validation failures and operational metrics.
 */
export const trackEventMiddleware = (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const originalJson = res.json;

  // Intercept the outbound JSON payload before it leaves the express core pipeline
  res.json = function (body: any): Response {
    res.json = originalJson;

    // Only monitor client-driven validation bottlenecks and edge cases (400-499)
    if (res.statusCode >= 400 && res.statusCode < 500) {
      const eventName = `API_ERROR_${res.statusCode}`;

      trackEvent(eventName, {
        userId: req.user?.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        metadata: {
          route: req.originalUrl,
          method: req.method,
          i18nKey: body?.i18nKey || "UNKNOWN_VALIDATION_KEY",
          message: body?.message,
        },
      });
    }
    return originalJson.call(this, body);
  };
  next();
};

import { getClientIp, IAuthRequest } from "@repo/shared";
import { Response, NextFunction } from "express";
import { Model } from "mongoose";
import { executeUserLogCreation } from "./service";

interface IAuditOptions<T extends Model<any>> {
  action: string;
  category: "AUTH" | "PROFILE" | "SECURITY" | "TRANSACTION" | "MODERATION";
  UserLogModel: T;
}

/**
 * Higher-order middleware to automatically capture and intercept user actions upon successful request lifecycles.
 */
export const auditAction = <T extends Model<any>>(
  options: IAuditOptions<T>,
) => {
  return (req: IAuthRequest, res: Response, next: NextFunction): void => {
    const authUserId = req.user?.id;
    const clientIp = getClientIp(req) || "unknown_client";
    const jwtDeviceId = req.user?.deviceId;

    // Intercept the response finish event to ensure we only log successful operations
    res.on("finish", () => {
      // Only log if the request was authenticated and returned a successful status code (2xx)
      if (authUserId && res.statusCode >= 200 && res.statusCode < 300) {
        // Fire-and-forget log creation so it doesn't block client response times
        executeUserLogCreation({
          UserLogModel: options.UserLogModel,
          userId: authUserId,
          action: options.action,
          category: options.category,
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || "unknown",
          deviceId: jwtDeviceId,
          metadata: {
            method: req.method,
            route: req.originalUrl,
          },
        }).catch((err: any) => {
          console.error("Async Audit Logging Failed:", err);
        });
      }
    });
    next();
  };
};

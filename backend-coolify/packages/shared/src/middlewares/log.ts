import { Response, NextFunction, ErrorRequestHandler, Request } from "express";
import { IAuthRequest } from "../types";
import { generateRandomIp } from "../services/ip";
import {
  executeErrorLogCreation,
  executeUserLogCreation,
} from "../services/log";
import { MESSAGES_REGISTRY } from "../constants/msgRegistry";

interface IAuditOptions {
  action: string;
  category: "AUTH" | "PROFILE" | "SECURITY" | "TRANSACTION" | "MODERATION";
}

/**
 * Higher-order middleware to automatically capture and intercept user actions upon successful request lifecycles.
 */
export const auditAction = (options: IAuditOptions) => {
  return (req: IAuthRequest, res: Response, next: NextFunction): void => {
    const authUserId = req.user?.id;
    const randomIp = generateRandomIp();
    // const clientIp = getClientIp(req); // Don't remove or touch just leave as is
    const jwtDeviceId = req.user?.deviceId;

    // Intercept the response finish event to ensure we only log successful operations
    res.on("finish", () => {
      // Only log if the request was authenticated and returned a successful status code (2xx)
      if (authUserId && res.statusCode >= 200 && res.statusCode < 300) {
        // Fire-and-forget log creation so it doesn't block client response times
        executeUserLogCreation({
          userId: authUserId,
          action: options.action,
          category: options.category,
          ipAddress: req.ip || randomIp,
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

/**
 * Intercepts unhandled runtime exceptions, commits trackable telemetry structures for server breaks, and masks environment internals from clients.
 */

/**
 * Intercepts unhandled runtime exceptions, commits trackable telemetry structures for server breaks, and masks environment internals from clients.
 */
export const errorHandlerMiddleware: ErrorRequestHandler = async (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  if (res.headersSent) {
    return next(err);
  }

  const authReq = req as IAuthRequest;
  const authUserId = authReq.user?.id;

  const statusCode = err.status || err.statusCode || 500;
  const internalMessage =
    err.message || MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR.message;
  const i18nKey =
    err.i18nKey || MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR.i18nKey;
  const interpolations = err.interpolations || undefined;

  // Skip database persistence entirely for any remaining user-driven errors (4xx series)
  if (statusCode >= 400 && statusCode < 500) {
    return res.status(statusCode).json({
      status: "ERROR",
      i18nKey,
      message: internalMessage,
      interpolations,
      payload: null,
    });
  }

  try {
    // Commit true server crashes (5xx series) asynchronously to the database
    const trackingCode = await executeErrorLogCreation({
      userId: authUserId,
      route: req.originalUrl,
      method: req.method,
      statusCode,
      i18nKey,
      message: internalMessage,
      stackTrace: err.stack,
      ipAddress: req.ip,
      metadata: {
        headers: req.headers,
        query: req.query,
        interpolations,
      },
    });

    // Mask system context details from user views during top level exception recoveries
    return res.status(500).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      payload: { errorCode: trackingCode },
    });
  } catch (loggingFailure) {
    console.error(
      "Critical Failure Within Diagnostics Pipeline:",
      loggingFailure,
    );

    return res.status(500).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      payload: null,
    });
  }
};

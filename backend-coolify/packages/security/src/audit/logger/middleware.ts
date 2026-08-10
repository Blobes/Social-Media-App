import { IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import { Response, NextFunction, ErrorRequestHandler, Request } from "express";
import { Model } from "mongoose";
import { executeErrorLogCreation } from "./services";

/**
 * Initializes the error handling middleware with the required database model context.
 */
export const globalErrorHandler = <T extends Model<any>>(
  ErrorLogModel: T,
): ErrorRequestHandler => {
  return async (
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

    // Direct return for 4xx series errors without persistence
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
      const trackingCode = await executeErrorLogCreation({
        ErrorLogModel,
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

      // Check if error was explicitly flagged as operational or carries custom translation info
      const isCustomError = Boolean(
        err.isOperational ||
        (err.i18nKey &&
          err.i18nKey !== MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR.i18nKey),
      );

      return res.status(statusCode).json({
        status: "ERROR",
        i18nKey: isCustomError
          ? i18nKey
          : MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR.i18nKey,
        message: isCustomError
          ? internalMessage
          : MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR.message,
        interpolations,
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
};

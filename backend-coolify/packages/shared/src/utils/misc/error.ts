import { TransInfo } from "../../types";
import { NextFunction } from "express";

/**
 * Custom operational error class to pass semantic messaging and translation parameters down request lifecycles.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly i18nKey: string;
  public readonly interpolations?: Record<string, any>;

  constructor(statusCode: number, transInfo: TransInfo) {
    super(transInfo.message || "An operational application error occurred.");
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.i18nKey = transInfo.i18nKey || "auth.server_fallback_error";
    this.interpolations = transInfo?.interpolations;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Normalizes caught exceptions into AppError instances and hands execution to the global error middleware.
 */
export const forwardError = (
  next: NextFunction,
  transInfo: TransInfo,
  originalError?: any,
  statusCode: number = 500,
): void => {
  // Preserve status code, i18nKey, and interpolations from original thrown operational errors
  const finalStatusCode =
    originalError?.status || originalError?.statusCode || statusCode;
  const finalTransInfo: TransInfo = {
    message: originalError?.message || transInfo.message,
    i18nKey: originalError?.i18nKey || transInfo.i18nKey,
    interpolations: originalError?.interpolations || transInfo?.interpolations,
  };

  const appError = new AppError(finalStatusCode, finalTransInfo);

  if (originalError?.stack) {
    appError.stack = originalError.stack;
  }
  next(appError);
};

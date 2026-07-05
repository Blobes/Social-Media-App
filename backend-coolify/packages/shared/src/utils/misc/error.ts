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
    // Provide a default fallback string if message is undefined to satisfy base Error constructor constraints
    super(transInfo.message || "An operational application error occurred.");
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.i18nKey = transInfo.i18nKey || "auth.server_fallback_error";
    this.interpolations = transInfo.interpolations;

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
  const appError = new AppError(statusCode, transInfo);

  if (originalError?.stack) {
    appError.stack = originalError.stack;
  }
  next(appError);
};

import { NextFunction } from "express";
import { MESSAGES_REGISTRY } from "../constants/msgRegistry";
import { TransInfo } from "../types/general";

/**
 * Interface defining operational application errors extending native Error.
 */
export interface IAppError extends Error {
  statusCode?: number;
  i18nKey?: string;
  interpolations?: Record<string, unknown>;
  isOperational?: boolean;
}

/**
 * Custom operational error class to pass semantic messaging and translation parameters down request lifecycles.
 */
export class AppError extends Error implements IAppError {
  public readonly statusCode: number;
  public readonly i18nKey: string;
  public readonly interpolations?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    transInfo: TransInfo,
    isOperational: boolean = true,
  ) {
    super(transInfo.message || "An operational application error occurred.");
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.i18nKey =
      transInfo.i18nKey || MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR.i18nKey;
    this.interpolations = transInfo?.interpolations;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Normalizes caught exceptions into AppError instances and hands execution to the global error middleware.
 */
export const forwardError = (
  next: NextFunction,
  transInfo: TransInfo,
  originalError?: unknown,
  statusCode: number = 500,
): void => {
  const err = originalError as Record<string, unknown> | undefined;

  const rawStatus = err?.status || err?.statusCode;
  const finalStatusCode =
    typeof rawStatus === "number" ? rawStatus : statusCode;

  const errMessage = typeof err?.message === "string" ? err.message : undefined;
  const errI18nKey = typeof err?.i18nKey === "string" ? err.i18nKey : undefined;
  const errInterpolations =
    err?.interpolations && typeof err.interpolations === "object"
      ? (err.interpolations as Record<string, unknown>)
      : undefined;

  // Preserve explicit message/i18nKey if originalError has them, otherwise fallback to transInfo
  const finalTransInfo: TransInfo = {
    message: errMessage || transInfo.message,
    i18nKey:
      errMessage && !errI18nKey
        ? MESSAGES_REGISTRY.AUTH.UNKNOWN_SERVER_ERROR(errMessage).i18nKey
        : errI18nKey || transInfo.i18nKey,
    interpolations: errInterpolations || transInfo?.interpolations,
  };

  const appError = new AppError(finalStatusCode, finalTransInfo, true);

  if (typeof err?.stack === "string") {
    appError.stack = err.stack;
  }
  next(appError);
};

/**
 * Constructs structured AppError domain instances for throw operations outside request middleware pipelines.
 */
export function createDomainError(
  message: string,
  i18nKey: string,
  statusCode: number = 500,
  interpolations?: Record<string, unknown>,
): AppError {
  return new AppError(
    statusCode,
    {
      message,
      i18nKey,
      interpolations,
    },
    true,
  );
}

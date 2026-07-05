import crypto from "crypto";
import { UserLogModel, ErrorLogModel } from "@repo/database";
import { TransInfo } from "../types";
import { MESSAGES_REGISTRY } from "../constants/msgRegistry";
import { Types } from "mongoose";

interface ICreateLogInput {
  userId: string;
  action: string;
  category: "AUTH" | "PROFILE" | "SECURITY" | "TRANSACTION" | "MODERATION";
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  metadata?: Record<string, any>;
}

interface IGetLogsInput {
  userId: string;
  page: number;
  limit: number;
  category?: string;
}

interface IGetLogsResult {
  status: "SUCCESS";
  transInfo: TransInfo;
  payload: any[];
}

/**
 * Creates a trackable business audit record for historical user operations.
 */
export const executeUserLogCreation = async (
  input: ICreateLogInput,
): Promise<void> => {
  const { userId, action, category, ipAddress, userAgent, deviceId, metadata } =
    input;

  await UserLogModel.create({
    userId,
    action,
    category,
    ipAddress,
    userAgent,
    deviceId,
    metadata,
  });
};

/**
 * Retrieves paginated timeline audit history records for a target user profile.
 */
export const executeUserLogsFetch = async (
  input: IGetLogsInput,
): Promise<IGetLogsResult> => {
  const { userId, page, limit, category } = input;
  const skip = (page - 1) * limit;

  const query: Record<string, any> = { userId: new Types.ObjectId(userId) };
  if (category) {
    query.category = category;
  }

  const logs = await UserLogModel.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const hasLogs = logs.length > 0;

  return {
    status: "SUCCESS",
    transInfo: hasLogs
      ? MESSAGES_REGISTRY.PROFILE.USER_LOGS_FETCHED_SUCCESS
      : MESSAGES_REGISTRY.PROFILE.NO_USER_LOGS_FOUND,
    payload: logs,
  };
};

interface ICreateErrorLogInput {
  userId?: string;
  route?: string;
  method?: string;
  statusCode: number;
  i18nKey?: string;
  message: string;
  stackTrace?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

interface IGetErrorLogsInput {
  page: number;
  limit: number;
  statusCode?: number;
  errorCode?: string;
}

interface IGetErrorLogsResult {
  status: "SUCCESS";
  transInfo: TransInfo;
  payload: any[];
}

interface IGetErrorLogDetailsResult {
  status: "SUCCESS" | "NOT_FOUND";
  transInfo: TransInfo;
  payload?: any;
}

interface IPurgeErrorLogsInput {
  statusCode?: number;
}

interface IPurgeErrorLogsResult {
  status: "SUCCESS";
  transInfo: TransInfo;
}

/**
 * Creates an immutable trace record for application errors and returns a trackable alphanumeric sequence.
 */
export const executeErrorLogCreation = async (
  input: ICreateErrorLogInput,
): Promise<string> => {
  const trackingCode = `ERR-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  await ErrorLogModel.create({
    userId: input.userId,
    errorCode: trackingCode,
    route: input.route,
    method: input.method,
    statusCode: input.statusCode,
    i18nKey: input.i18nKey,
    message: input.message,
    stackTrace: input.stackTrace,
    ipAddress: input.ipAddress,
    metadata: input.metadata,
  });

  return trackingCode;
};

/**
 * Retrieves a paginated list of tracking records for administrative diagnostics.
 */
export const executeErrorLogsFetch = async (
  input: IGetErrorLogsInput,
): Promise<IGetErrorLogsResult> => {
  const { page, limit, statusCode, errorCode } = input;
  const skip = (page - 1) * limit;

  const query: Record<string, any> = {};
  if (statusCode) query.statusCode = statusCode;
  if (errorCode) query.errorCode = errorCode.trim();

  const logs = await ErrorLogModel.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const hasLogs = logs.length > 0;

  return {
    status: "SUCCESS",
    transInfo: hasLogs
      ? MESSAGES_REGISTRY.SYSTEM.ERROR_LOGS_FETCHED_SUCCESS
      : MESSAGES_REGISTRY.SYSTEM.NO_ERROR_LOGS_FOUND,
    payload: logs,
  };
};

/**
 * Resolves full internal details for a targeted tracing log item.
 */
export const executeErrorLogDetailsFetch = async (
  idOrCode: string,
): Promise<IGetErrorLogDetailsResult> => {
  const query = Types.ObjectId.isValid(idOrCode)
    ? { _id: new Types.ObjectId(idOrCode) }
    : { errorCode: idOrCode.trim() };

  const logEntry = await ErrorLogModel.findOne(query).lean();

  if (!logEntry) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.SYSTEM.ERROR_LOG_NOT_FOUND,
    };
  }

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.SYSTEM.ERROR_LOG_DETAILS_FETCHED,
    payload: logEntry,
  };
};

/**
 * Explicitly removes recorded fault records under selected status match brackets.
 */
export const executeErrorLogsPurge = async (
  input: IPurgeErrorLogsInput,
): Promise<IPurgeErrorLogsResult> => {
  const query: Record<string, any> = {};
  if (input.statusCode) query.statusCode = input.statusCode;

  await ErrorLogModel.deleteMany(query);

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.SYSTEM.ERROR_LOGS_PURGED_SUCCESS,
  };
};

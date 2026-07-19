import crypto from "crypto";
import { Types, Model } from "mongoose";
import { MESSAGES_REGISTRY, TransInfo } from "@repo/shared";

interface ICreateErrorLogInput<T extends Model<any>> {
  ErrorLogModel: T;
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

interface IGetErrorLogsInput<T extends Model<any>> {
  ErrorLogModel: T;
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

interface IPurgeErrorLogsInput<T extends Model<any>> {
  ErrorLogModel: T;
  statusCode?: number;
}

interface IPurgeErrorLogsResult {
  status: "SUCCESS";
  transInfo: TransInfo;
}

/**
 * Creates an immutable trace record for application errors and returns a trackable alphanumeric sequence.
 */
export const executeErrorLogCreation = async <T extends Model<any>>(
  input: ICreateErrorLogInput<T>,
): Promise<string> => {
  const { ErrorLogModel } = input;
  const trackingCode = `ERR-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  // Persist the tracing record utilizing the injected collection driver instance
  await ErrorLogModel.create({
    userId: input.userId ? new Types.ObjectId(input.userId) : undefined,
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
export const executeErrorLogsFetch = async <T extends Model<any>>(
  input: IGetErrorLogsInput<T>,
): Promise<IGetErrorLogsResult> => {
  const { ErrorLogModel, page, limit, statusCode, errorCode } = input;
  const skip = (page - 1) * limit;

  const query: Record<string, any> = {};
  if (statusCode) query.statusCode = statusCode;
  if (errorCode) query.errorCode = errorCode.trim();

  // Run a sorted window aggregation mapping matches down to plain memory spaces
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
export const executeErrorLogDetailsFetch = async <T extends Model<any>>(
  ErrorLogModel: T,
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
export const executeErrorLogsPurge = async <T extends Model<any>>(
  input: IPurgeErrorLogsInput<T>,
): Promise<IPurgeErrorLogsResult> => {
  const { ErrorLogModel, statusCode } = input;
  const query: Record<string, any> = {};
  if (statusCode) query.statusCode = statusCode;

  // Execute bulk purge operations globally matching the targeting configuration
  await ErrorLogModel.deleteMany(query);

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.SYSTEM.ERROR_LOGS_PURGED_SUCCESS,
  };
};

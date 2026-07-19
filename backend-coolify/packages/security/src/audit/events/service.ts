import { Model, Types } from "mongoose";
import { MESSAGES_REGISTRY, TransInfo } from "@repo/shared";

interface ICreateLogInput<T extends Model<any>> {
  UserLogModel: T;
  userId: string;
  action: string;
  category: "AUTH" | "PROFILE" | "SECURITY" | "TRANSACTION" | "MODERATION";
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  metadata?: Record<string, any>;
}

export interface IGetLogsInput<T extends Model<any>> {
  UserLogModel: T;
  userId: string;
  page: number;
  limit: number;
  category?: string;
}

export interface IGetLogsResult {
  status: "SUCCESS";
  transInfo: TransInfo;
  payload: any[];
}

/**
 * Creates a trackable business audit record for historical user operations.
 */
export const executeUserLogCreation = async <T extends Model<any>>(
  input: ICreateLogInput<T>,
): Promise<void> => {
  const {
    userId,
    action,
    category,
    ipAddress,
    userAgent,
    deviceId,
    metadata,
    UserLogModel,
  } = input;

  // Persist the structured log data directly using the injected model instance
  await UserLogModel.create({
    userId: new Types.ObjectId(userId),
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
export const executeUserLogsFetch = async <T extends Model<any>>(
  input: IGetLogsInput<T>,
): Promise<IGetLogsResult> => {
  const { userId, page, limit, category, UserLogModel } = input;
  const skip = (page - 1) * limit;

  const query: Record<string, any> = { userId: new Types.ObjectId(userId) };
  if (category) {
    query.category = category;
  }

  // Mongoose's built-in Model type automatically resolves chainable query interfaces
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

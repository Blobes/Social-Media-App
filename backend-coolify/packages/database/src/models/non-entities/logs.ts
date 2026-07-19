import { Schema, Types, model, Model } from "mongoose";

export interface IUserLogDocument {
  userId: Types.ObjectId;
  action: string;
  category: "AUTH" | "PROFILE" | "SECURITY" | "TRANSACTION" | "MODERATION";
  ipAddress?: string;
  userAgent?: string;
  deviceId?: Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const UserLogSchema = new Schema<IUserLogDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["AUTH", "PROFILE", "SECURITY", "TRANSACTION", "MODERATION"],
      required: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: "Device",
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

export const UserLogModel: Model<IUserLogDocument> = model<IUserLogDocument>(
  "UserLog",
  UserLogSchema,
  "user_logs",
);

export interface IErrorLog {
  userId?: Types.ObjectId;
  errorCode: string;
  route?: string;
  method?: string;
  statusCode: number;
  i18nKey?: string;
  message: string;
  stackTrace?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const ErrorLogSchema = new Schema<IErrorLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    errorCode: {
      type: String,
      required: true,
      unique: true,
    },
    route: {
      type: String,
      trim: true,
    },
    method: {
      type: String,
      uppercase: true,
      trim: true,
    },
    statusCode: {
      type: Number,
      required: true,
    },
    i18nKey: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    stackTrace: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: { expires: 2592000 },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

export const ErrorLogModel: Model<IErrorLog> = model<IErrorLog>(
  "ErrorLog",
  ErrorLogSchema,
  "error_logs",
);

import { Schema, model, Model } from "mongoose";
import { IErrorLogDocument, IUserLogDocument } from "../../types/user";

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

// User Log Schema Indexes
UserLogSchema.index({ userId: 1, createdAt: -1 });
UserLogSchema.index({ category: 1, createdAt: -1 });
UserLogSchema.index({ action: 1, createdAt: -1 });

/**
 * Model schema for auditing user activities and security events.
 */
export const UserLogModel: Model<IUserLogDocument> = model<IUserLogDocument>(
  "UserLog",
  UserLogSchema,
  "user_logs",
);

const ErrorLogSchema = new Schema<IErrorLogDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    errorCode: {
      type: String,
      required: true,
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
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// Error Log Schema Indexes
ErrorLogSchema.index({ errorCode: 1 }, { unique: true });
ErrorLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
ErrorLogSchema.index({ userId: 1, createdAt: -1 });
ErrorLogSchema.index({ statusCode: 1, createdAt: -1 });

/**
 * Model schema for tracking application error logs and system failures.
 */
export const ErrorLogModel: Model<IErrorLogDocument> = model<IErrorLogDocument>(
  "ErrorLog",
  ErrorLogSchema,
  "error_logs",
);

import { Schema, model, Model } from "mongoose";
import { IAccountStatusHistory } from "../../../types/status";

const AccountStatusHistorySchema = new Schema<IAccountStatusHistory>(
  {
    account: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    previousStatus: {
      type: String,
      enum: ["ACTIVE", "DEACTIVATED", "SUSPENDED", "BANNED"],
      required: true,
    },
    newStatus: {
      type: String,
      enum: ["ACTIVE", "DEACTIVATED", "SUSPENDED", "BANNED"],
      required: true,
    },
    reason: {
      type: String,
      default: null,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    changedByType: {
      type: String,
      enum: ["SYSTEM", "ADMIN", "OWNER"],
      required: true,
    },
    suspensionExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);
export const AccountStatusHistoryModel: Model<IAccountStatusHistory> = model(
  "AccountStatusHistory",
  AccountStatusHistorySchema,
  "account_status_history",
);

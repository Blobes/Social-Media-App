import { Document, Schema, Types, model, Model } from "mongoose";
import { IDeactivatedAccount } from "../../types/user";

// export interface IDeactivatedAccountDocument extends Document {
//   userId: Types.ObjectId;
//   reason:
//     | "USER_DEACTIVATION"
//     | "SYSTEM_SUSPENSION"
//     | "ADMIN_SUSPENSION"
//     | "INACTIVE_STALE";
//   description?: string;
//   deactivatedAt: Date;
//   createdAt: Date;
//   updatedAt: Date;
// }

const DeactivatedAccountSchema = new Schema<IDeactivatedAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    reason: {
      type: String,
      enum: [
        "USER_DEACTIVATION",
        "SYSTEM_SUSPENSION",
        "ADMIN_SUSPENSION",
        "INACTIVE_STALE",
      ],
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    deactivatedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

export const DeactivatedAccountModel: Model<IDeactivatedAccount> =
  model<IDeactivatedAccount>(
    "DeactivatedAccount",
    DeactivatedAccountSchema,
    "deactivated_accounts",
  );

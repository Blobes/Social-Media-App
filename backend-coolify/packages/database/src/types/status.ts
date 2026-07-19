import { Types, Document } from "mongoose";
import { AccountStatus } from "./user";
import { ModeratorType } from "./moderation";

export type ChangedByType = ModeratorType | "OWNER";

export interface IAccountStatusHistory extends Document {
  account: Types.ObjectId;
  previousStatus: AccountStatus;
  newStatus: AccountStatus;
  reason?: string | null;
  changedBy?: Types.ObjectId | null;
  changedByType: ChangedByType;
  suspensionExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

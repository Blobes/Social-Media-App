import { Types, Document } from "mongoose";
import { ModeratorType } from "./moderation";

export type AccountStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "DEACTIVATED"
  | "SUSPENDED"
  | "BANNED";
// | "NOT_ONBOARDED";
export type VerificationStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

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

export interface ITfaData {
  secret: string | null; // Encrypted or plain secure base32 string
  isEnabled: boolean; // Active status toggle
  backupCodes: string[]; // Fallback recovery matrices
  tempSecret: string | null;
  tempBackupCodes: string[];
}

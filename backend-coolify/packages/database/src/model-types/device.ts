import { Document, Types } from "mongoose";

/**
 * Interface representing the Device document in MongoDB.
 */
export interface IDevice extends Document {
  userId: Types.ObjectId;
  deviceToken: string;
  name: string | null;
  deviceType?: string;
  os?: string;
  browser?: string;
  userAgent?: string;
  ipHash?: string;
  lastCountry?: string;
  isPrimary: boolean;
  isStale: boolean;
  lastSeenAt: Date;
  lastVerifiedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

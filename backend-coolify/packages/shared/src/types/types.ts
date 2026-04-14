import { GistModel } from "@repo/database";
import { Request } from "express";
import { InferSchemaType } from "mongoose";

export type ILikelihood =
  | "UNKNOWN"
  | "VERY_UNLIKELY"
  | "UNLIKELY"
  | "POSSIBLE"
  | "LIKELY"
  | "VERY_LIKELY";

export enum ISeverity {
  CRITICAL = "CRITICAL", // Blocked + Account Flagged (Hard Block)
  MODERATE = "MODERATE", // Blocked + Requires Edit (Soft Block)
  LOW = "LOW", // Allowed + Labeled/Hidden (Soft Label)
}

export type AppName =
  | "ADMIN_SERVICE"
  | "ACCOUNT_SERVICE"
  | "POST_SERVICE"
  | "USER_SERVICE"
  | "WORKER_SERVICE"
  | "GATEWAY";

export type PostType = "GIST" | "STAKE";

export type OtpType = "EMAIL" | "SMS" | "WHATSAPP";

export interface IJwtUser {
  id: any;
  sessionId: string;
  email?: string;
  username?: string;
  isAdmin?: boolean;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: "USER" | "ADMIN" | "MODERATOR";
}

export interface IModerationReq {
  topics: string[];
  severity?: ISeverity | null;
  needsReview: boolean;
  ruleViolated?: string | null;
  isUnsure?: boolean;
  reason?: string | null;
}

export interface IAuthRequest extends Request {
  user?: IJwtUser;
  moderation?: IModerationReq;
}

export interface IMediaInput {
  url: string;
  fileKey: string;
  type: "IMAGE" | "VIDEO" | "GIF";
  thumbnailUrl?: string;
  mimeType?: string;
  size?: number;
  dimensions?: { width: number; height: number; aspectRatio: number };
  blurHash?: string;
  storageProvider?: "S3" | "CLOUDINARY" | "GCP";
}

export interface IModerationRes {
  extractedTopics: string[];
  isFlagged?: boolean;
  isUnsure: boolean;
  severity: ISeverity | null;
  ruleViolated: string | null;
  reason: string | null;
}

export interface IUserPreferences {
  userId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  location?: string | null;
  preferredTopics: {
    topicId: string;
    title: string;
    lastViewed?: Date;
  }[];
  showSensitiveGraphic: boolean;
  blockedUserIds: string[]; // Hydrated from the separate collection
}

export type IGist = InferSchemaType<typeof GistModel.schema>;

export interface IBasePost {
  id: any;
  authorId: any;
  topics?: string[];
  //location?: string;
  location?: {
    name?: string;
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  hasSensitiveGraphic?: boolean;
  [key: string]: any; // Allows for post-specific fields (e.g., gist content, video URL)
}

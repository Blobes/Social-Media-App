import { GistModel, IMedia } from "@repo/database";
import { MediaType, Request, RequestHandler } from "express";
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

export type OtpType = "EMAIL" | "SMS" | "WHATSAPP" | "PHONE";

export type VerificationPurpose =
  | "LOGIN_VERIFICATION"
  | "IDENTIFIER_UPDATE"
  | "PASSWORD_RESET";

export type Role = "USER" | "ADMIN" | "MODERATOR";

export interface IJwtUser {
  id: any;
  deviceId: string;
  sessionId: string;
  email?: string;
  username?: string;
  isAdmin?: boolean;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
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

export interface IAuthConfig {
  ACCESS_TOKEN_SECRET: string;
  REFRESH_TOKEN_SECRET: string;
}

export interface IVerifyAuth {
  verifyAuthToken: RequestHandler;
  optionalAuth?: RequestHandler;
}

export interface IMediaConfig extends IVerifyAuth {
  uploadConfig: IS3Config;
}

export interface IS3Config {
  REGION: string;
  ACCESS_KEY_ID: string;
  SECRET_ACCESS_KEY: string;
  BUCKET_NAME: string;
}

export interface IEmailDispatchTokens {
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;

  GMAIL_USER?: string;
  GMAIL_CLIENT_ID?: string;
  GMAIL_CLIENT_SECRET?: string;
  GMAIL_REFRESH_TOKEN?: string;

  HOTMAIL_USER?: string;
  HOTMAIL_PASSWORD?: string;
  HOTMAIL_FROM_EMAIL?: string;

  YAHOO_USER?: string;
  YAHOO_PASSWORD?: string;
  YAHOO_FROM_EMAIL?: string;

  SMTP_HOST_EMAIL?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
}

export interface IPhoneDispatchTokens {
  WHATSAPP_API_URL?: string;
  WHATSAPP_ACCESS_KEY?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_BUSINESS_ACCOUNT_ID?: string;
}

export interface ICodeDispatchTokens
  extends IEmailDispatchTokens, IPhoneDispatchTokens {}

export interface OtpJobPayload {
  type: OtpType;
  code: string;
  email?: string;
  phone?: string;
}

export interface IPostModData {
  postId: string;
  postType: PostType;
  userId: string;
  caption?: string;
  media?: IMedia[];
  topics?: string[];
  skipModeration?: boolean;
  event: "POST_CREATION" | "POST_UPDATE";
}

import {
  AccountStatus,
  GistModel,
  IMedia,
  IPostStatus,
  ModerationSeverity,
} from "@repo/database";
import { Request, RequestHandler } from "express";
import mongoose, { InferSchemaType } from "mongoose";

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
  NONE = "NONE",
}

export type AppName =
  | "PLATFORM_SERVICE"
  | "ACCOUNT_SERVICE"
  | "POST_SERVICE"
  | "WORKER_SERVICE"
  | "GATEWAY";

export type PostType = "GIST" | "STAKE";

export type MsgPostType = "Gist" | "Stake" | "Post";

export type ModerationTaskMode =
  | "MODERATE_ONLY"
  | "MODERATE_AND_EXTRACT_KEYWORDS"
  | "EXTRACT_KEYWORDS_ONLY";

export type OtpType = "EMAIL" | "SMS" | "WHATSAPP" | "PHONE";

export enum VerificationPurpose {
  LOGIN = "LOGIN_VERIFICATION",
  SIGNUP = "SIGNUP_VERIFICATION",
  IDENTIFIER_UPDATE = "IDENTIFIER_UPDATE",
  PASSWORD_RESET = "PASSWORD_RESET",
}

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
  accountStatus?: AccountStatus;
  role?: Role;
}

export interface IAuthRequest extends Request {
  user?: IJwtUser;
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

export interface IInternalTokenConfig {
  INTERNAL_TOKEN_SECRET: string;
}
export interface IValidateInternalToken {
  validateInternalToken: RequestHandler;
}

export interface IS3Config {
  REGION: string;
  ACCESS_KEY_ID: string;
  SECRET_ACCESS_KEY: string;
  BUCKET_NAME: string;
  ENDPOINT_URL: string;
  PUBLIC_URL: string;
}

export interface IUploadConfig extends IVerifyAuth, IValidateInternalToken {
  uploadConfig: IS3Config;
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

export interface IModResult {
  extractedTopics: string[];
  severity: ModerationSeverity | null;
  ruleViolated: string | null;
  reason: string | null;
  needsReview: boolean;
  status: IPostStatus;
  hasSensitiveGraphic?: boolean;
}

type ModEventType = "POST_CREATION" | "POST_UPDATE";

export interface FinalizePostReq {
  postId: string;
  userId: string;
  postType: PostType;
  caption?: string;
  media: IMedia[];
  event: ModEventType;
  modResult: IModResult;
  session: mongoose.ClientSession;
}

export interface IPostModData {
  postId: string;
  postType: PostType;
  userId: string;
  caption?: string;
  media?: IMedia[];
  topics?: string[];
  event: ModEventType;
  moderationTaskMode: ModerationTaskMode;
}

export interface FlagPostData {
  postId: string;
  postType: PostType;
  authorId: string;
  source: "AI" | "USER";
  severity: ISeverity | null;
  ruleViolated: string;
  reason: string;
  contentSnapshot: {
    text?: string;
    mediaIds?: string[];
  };
}

export interface TransInfo {
  readonly i18nKey?: string;
  readonly message?: string;
  readonly interpolations?: Record<string, any>;
}

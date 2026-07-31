import { Document } from "mongoose";
import { IContentModeration } from "./moderation";
import { Types } from "mongoose";
import { ILocation } from "./user";

export type PostVisibility =
  | "DRAFT"
  | "PUBLIC"
  | "FRIENDS_ONLY"
  | "FOLLOWERS"
  | "MENTIONS_ONLY";

export type PostStatus =
  | "PUBLISHED"
  | "DELETED"
  | "SHADOWBANNED"
  | "ARCHIVED"
  | "UNDER_REVIEW"
  | "BANNED";

export interface IGistDocument extends Document {
  authorId: Types.ObjectId | string;
  mediaIds: Types.ObjectId[];
  status: PostStatus;

  latestCaption: {
    captionId?: string | null;
    caption: string;
    detectedLanguage?: string;
    //  detectedLanguageShort?: string;
    createdAt?: Date;
  };
  editCount: number;

  // Engagement & Metrics
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;

  // Discovery
  topics: string[];
  location?: ILocation;

  // Configuration
  visibility: PostVisibility;
  allowComments: boolean;
  isPinned: boolean;
  hasSensitiveGraphic: boolean;

  // Moderation
  moderationCase?: IContentModeration;

  createdAt: string;
  updatedAt: string;
}

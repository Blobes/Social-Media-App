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

export type PostModelType = "Gist" | "Stake" | "Post";

export interface IPostCaption {
  captionId?: string | null;
  caption: string;
  detectedLanguage?: string;
  // detectedLanguageShort?: string;
  createdAt?: Date;
}

export interface IGistDocument extends Document {
  authorId: Types.ObjectId | string;
  mediaIds: Types.ObjectId[];
  status: PostStatus;

  latestCaption: IPostCaption;
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

/**
 * Interface defining the Stake document structure.
 */
export interface IStakeDocument extends Document {
  authorId: Types.ObjectId;
  postType?: PostModelType | null;
  postId?: Types.ObjectId | null;
  latestCaption: IPostCaption;
  mediaIds: Types.ObjectId[];
  topics: string[];
  location?: ILocation;
  visibility: PostVisibility;
  hasSensitiveGraphic: boolean;
  status: PostStatus;
  moderationCase?: IContentModeration;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface defining the Bookmark document structure.
 */
export interface IBookmarkDocument extends Document {
  userId: Types.ObjectId;
  postId: Types.ObjectId;
  postType: PostModelType;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface defining the Post Caption document structure.
 */
export interface IPostCaptionDocument extends Document {
  postId: Types.ObjectId;
  postType: PostModelType;
  caption: string;
  version: number;
  isLatest: boolean;
  detectedLanguage: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface defining the Gist Like document structure.
 */
export interface IGistLikeDocument extends Document {
  userId: Types.ObjectId;
  gistId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface defining the Post View document structure.
 */
export interface IPostViewDocument extends Document {
  postId: Types.ObjectId;
  postType: PostModelType;
  userId: Types.ObjectId;
  viewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

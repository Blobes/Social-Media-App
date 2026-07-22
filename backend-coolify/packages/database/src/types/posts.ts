import { Document } from "mongoose";
import { IContentModeration } from "./moderation";
import { Types } from "mongoose";

export type PostVisibility =
  | "PUBLIC"
  | "FOLLOWERS"
  | "PRIVATE"
  | "MENTIONED_ONLY";

export type IPostStatus =
  | "PUBLISHED"
  | "DELETED"
  | "SHADOWBANNED"
  | "ARCHIVED"
  | "UNDER_REVIEW"
  | "BANNED"
  | "DRAFT";

export interface IGistDocument extends Document {
  authorId: Types.ObjectId | string;
  mediaIds: Types.ObjectId[];
  status: IPostStatus;

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
  location?: {
    name?: string;
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };

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

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

export interface IGist {
  _id: string;
  authorId: string;
  mediaIds: string[];

  latestCaption: {
    captionId?: string | null;
    caption: string;
    createdAt?: string;
    detectedLanguage?: string;
    detectedLanguageShort?: string;
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
  status: IPostStatus;
  moderationLogId?: string | null;
  moderationCount: number;

  createdAt: string;
  updatedAt: string;
}

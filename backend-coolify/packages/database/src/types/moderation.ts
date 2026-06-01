import { Document, Types } from "mongoose";

export interface IFlaggedPost extends Document {
  postId: Types.ObjectId;
  postType: "GIST" | "STAKE";
  authorId: Types.ObjectId;
  violationSummary: string[];
  priority: "HIGH" | "NORMAL";
  reviewStatus: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  reviewedBy?: Types.ObjectId;
  resolutionNote?: string;
  contentSnapshot: {
    text?: string;
    media: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IPostReport extends Document {
  flaggedPostId: Types.ObjectId;
  reporterId: Types.ObjectId | null;
  source: "AI" | "USER";
  severity: "CRITICAL" | "MODERATE" | "LOW" | "NONE" | null;
  reason: string;
  ruleViolated: string;
  createdAt: Date;
  updatedAt: Date;
}

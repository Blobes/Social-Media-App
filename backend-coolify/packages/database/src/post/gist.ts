import { Schema, model, models, Document, Model, Types } from "mongoose";
import { IGistModel } from "@repo/model-types";

export interface IGistDocument
  extends
    Omit<
      IGistModel,
      | "_id"
      | "authorId"
      | "mediaIds"
      | "createdAt"
      | "updatedAt"
      | "latestCaption"
      | "moderationLogId"
    >,
    Document {
  authorId: Types.ObjectId;
  mediaIds: Types.ObjectId[];
  latestCaption: {
    captionId?: Types.ObjectId | null;
    caption: string;
    createdAt?: Date;
  };
  moderationLogId?: Types.ObjectId | null;
}

const GistSchema = new Schema<IGistDocument>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mediaIds: [{ type: Schema.Types.ObjectId, ref: "Media" }],

    latestCaption: {
      captionId: {
        type: Schema.Types.ObjectId,
        ref: "PostCaption",
      },
      caption: { type: String, required: true },
      createdAt: { type: Date, default: Date.now, required: false },
    },
    editCount: { type: Number, default: 0 },

    // Engagement & Metrics
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },

    // Discovery & Categorization
    topics: [{ type: String }],
    location: {
      name: { type: String },
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
        index: "2dsphere",
      },
    },

    // Configuration
    visibility: {
      type: String,
      enum: ["PUBLIC", "FOLLOWERS", "PRIVATE", "MENTIONED_ONLY"],
      default: "PUBLIC",
    },
    allowComments: { type: Boolean, default: true },
    isPinned: { type: Boolean, default: false },
    hasSensitiveGraphic: { type: Boolean, default: false }, // Useful for "Blur" UI filters

    // --- Moderation State ---
    status: {
      type: String,
      enum: [
        "PUBLISHED",
        "DELETED",
        "SHADOWBANNED",
        "ARCHIVED",
        "UNDER_REVIEW",
        "BANNED",
      ],
      default: "PUBLISHED",
    },
    moderationLogId: {
      type: Schema.Types.ObjectId,
      ref: "FlaggedPost",
      default: null,
    },
    moderationCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    autoIndex: false,
    toJSON: {
      virtuals: true,
      transform: (doc, ret: any) => {
        if (ret._id) ret._id = ret._id.toString();
        return ret;
      },
    },
  },
);

export const GistModel: Model<IGistDocument> =
  models.Gist || model<IGistDocument>("Gist", GistSchema, "gists");

// Like Schema
const GistLikeSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    gistId: {
      type: Schema.Types.ObjectId,
      ref: "Gist",
      required: true,
    },
  },
  {
    timestamps: true,
    autoIndex: false, // Stop mongodb auto index
  },
);

export const GistLikeModel = model("GistLike", GistLikeSchema, "gist_likes");

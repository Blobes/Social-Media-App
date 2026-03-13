import { Schema, model } from "mongoose";

const GistSchema = new Schema(
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

    // Engagement & Metrics
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },

    // Discovery & Categorization
    topics: [{ type: Schema.Types.ObjectId, ref: "Topic" }],
    tags: [{ type: String }],
    location: {
      name: { type: String, default: null },
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
  { timestamps: true },
);

GistSchema.index({ status: 1, authorId: 1, createdAt: -1 });
GistSchema.index({ tags: 1 });

export const GistModel = model("Gist", GistSchema, "gists");

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
  { timestamps: true },
);
GistLikeSchema.index({ userId: 1, gistId: 1 }, { unique: true });
export const GistLikeModel = model("GistLike", GistLikeSchema, "gist_likes");

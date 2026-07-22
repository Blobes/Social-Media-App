import { Schema, model, Model } from "mongoose";
import { IGistDocument } from "../../types/posts";

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
      detectedLanguage: { type: String, default: "en" },
      createdAt: { type: Date, default: Date.now, required: false },
    },
    editCount: { type: Number, default: 0 },

    // Engagement & Metrics
    likeCount: { type: Number, default: 0, min: 0 },
    commentCount: { type: Number, default: 0, min: 0 },
    shareCount: { type: Number, default: 0, min: 0 },
    viewCount: { type: Number, default: 0, min: 0 },

    // Discovery & Categorization
    topics: { type: [{ type: String }], default: [] },
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
    moderationCase: {
      caseId: {
        type: Schema.Types.ObjectId,
        ref: "ModerationCase",
        default: null,
      },
      caseCount: { type: Number, default: 0 },
    },
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

export const GistModel: Model<IGistDocument> = model<IGistDocument>(
  "Gist",
  GistSchema,
  "gists",
);

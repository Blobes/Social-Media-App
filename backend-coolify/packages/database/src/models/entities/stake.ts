import { Schema, model } from "mongoose";

const StakeSchema = new Schema(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    postType: {
      type: String,
      required: true,
      enum: ["Gist"],
      default: null,
    },
    postId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "postType",
      default: null,
    },
    // The shell only needs a placeholder for the initial text
    latestCaption: {
      caption: { type: String, required: true },
    },
    // References to be filled by the Worker
    mediaIds: [{ type: Schema.Types.ObjectId, ref: "Media" }],
    topics: [{ type: String }],

    // Geographical data (assigned in the Controller)
    location: {
      name: { type: String },
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },

    // UI Configuration
    visibility: {
      type: String,
      enum: ["PUBLIC", "FOLLOWERS", "PRIVATE", "MENTIONED_ONLY"],
      default: "PUBLIC",
    },
    hasSensitiveGraphic: { type: Boolean, default: false },

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
      default: "UNDER_REVIEW", // Always start here for the worker flow
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
  },
);

export const StakeModel = model("Stake", StakeSchema, "stakes");

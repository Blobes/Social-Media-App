import { Schema, model } from "mongoose";

const FlaggedPostSchema = new Schema(
  {
    // Dynamic Reference: Points to Gist or Stake
    postId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "postType",
    },
    postType: {
      type: String,
      required: true,
      enum: ["GIST", "STAKE"],
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Unique list of all rules violated for high-level filtering (e.g., "SPAM", "HATE_SPEECH")
    violationSummary: [{ type: String }],

    priority: {
      type: String,
      enum: ["HIGH", "NORMAL"],
      default: "NORMAL",
    },

    reviewStatus: {
      type: String,
      enum: ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    resolutionNote: { type: String },

    // Snapshot of content at the time of flagging to prevent "Edit to hide" tactics
    contentSnapshot: {
      text: { type: String },
      media: [{ type: String }],
    },
  },
  { timestamps: true },
);

// --- Optimized Indexes for the New Architecture ---
// Helps admins find pending cases quickly
FlaggedPostSchema.index({ reviewStatus: 1, createdAt: -1 });
// Efficient lookup when a post is flagged again
FlaggedPostSchema.index({ postId: 1, postType: 1 });
// Filter by violation type (e.g., "Show me all Hate Speech cases")
FlaggedPostSchema.index({ violationSummary: 1 });

export const FlaggedPostModel = model(
  "FlaggedPost",
  FlaggedPostSchema,
  "flagged_posts",
);

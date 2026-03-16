import { Schema, model } from "mongoose";

const PostReportSchema = new Schema(
  {
    flaggedPostId: {
      type: Schema.Types.ObjectId,
      ref: "FlaggedPost",
      required: true,
    },
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null, // Null for AI
    },
    source: {
      type: String,
      enum: ["AI", "USER"],
      required: true,
    },
    severity: {
      type: String,
      enum: ["CRITICAL", "MODERATE", "LOW"],
      required: true,
    },
    reason: { type: String, required: true },
    ruleViolated: { type: String, required: true },
    confidence: { type: Number }, // For AI scores
  },
  { timestamps: true },
);

// CRITICAL: This index prevents a user from reporting the same post twice
// It also makes counting reports for a specific post lightning fast
PostReportSchema.index(
  { flaggedPostId: 1, reporterId: 1 },
  { unique: true, sparse: true },
);

export const PostReportModel = model(
  "PostReport",
  PostReportSchema,
  "post_reports",
);

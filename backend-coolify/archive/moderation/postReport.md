import { Schema, model } from "mongoose";
import { IPostReport } from "../../types/moderation";

const PostReportSchema = new Schema<IPostReport>(
  {
    flaggedPostId: {
      type: Schema.Types.ObjectId,
      ref: "FlaggedPost",
      required: true,
    },
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
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
  },
  { timestamps: true },
);

export const PostReportModel = model(
  "PostReport",
  PostReportSchema,
  "post_reports",
);

import { Schema, model, Model } from "mongoose";
import {
  IModerationCase,
  IModerationEvidence,
  IModerationReport,
  IModerationStrike,
} from "../../types/moderation";

// Unique Cases Records
export const ModerationCaseSchema = new Schema<IModerationCase>(
  {
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ["PROFILE", "POST", "COMMENT", "MESSAGE", "MEDIA", "COMMUNITY"],
      index: true,
    },
    targetOwner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
      index: true,
    },
    status: {
      type: String,
      enum: [
        "OPEN",
        "UNDER_REVIEW",
        "RESOLVED",
        "DISMISSED",
        "ESCALATED",
        "APPEALED",
      ],
      default: "OPEN",
      index: true,
    },
    decision: {
      type: String,
      enum: [
        "NONE",
        "NO_ACTION",
        "WARNING",
        "CONTENT_REMOVED",
        "CONTENT_RESTORED",
        "STRIKE_ISSUED",
        "ACCOUNT_SUSPENDED",
        "ACCOUNT_BANNED",
        "ACCOUNT_DEACTIVATED",
      ],
      default: "NONE",
    },
    assignedModerator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "UserRoleSchema",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    aiGenerated: {
      type: Boolean,
      default: false,
      index: true,
    },
    requiresHumanReview: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    autoIndex: true,
  },
);
ModerationCaseSchema.index({
  status: 1,
  priority: -1,
  createdAt: -1,
});
ModerationCaseSchema.index({
  targetType: 1,
  targetId: 1,
});
ModerationCaseSchema.index({
  targetOwner: 1,
  createdAt: -1,
});
export const ModerationCaseModel: Model<IModerationCase> = model(
  "ModerationCase",
  ModerationCaseSchema,
  "moderation_cases",
);

// Penalized Accounts
export const ModerationStrikeSchema = new Schema<IModerationStrike>(
  {
    account: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    issuedByType: {
      type: String,
      enum: ["SYSTEM", "ADMIN", "MODERATOR"],
      required: true,
    },
    category: {
      type: String,
      enum: [
        "SPAM",
        "HARASSMENT",
        "HATE_SPEECH",
        "MISINFORMATION",
        "IMPERSONATION",
        "VIOLENCE",
        "SELF_HARM",
        "SEXUAL_CONTENT",
        "CHILD_SAFETY",
        "COPYRIGHT",
        "PRIVACY",
        "SCAM",
        "FAKE_ACCOUNT",
        "OTHER",
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      required: true,
    },
    points: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    relatedPostType: {
      type: String,
      enum: ["Gist", "Stake"],
      default: null,
    },
    relatedPost: {
      type: Schema.Types.ObjectId,
      refPath: "relatedPostType",
      default: null,
    },
    relatedComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);
export const ModerationStrikeModel: Model<IModerationStrike> = model(
  "ModerationStrike",
  ModerationStrikeSchema,
  "moderation_strikes",
);

// Reported cases
export const ModerationReportSchema = new Schema<IModerationReport>(
  {
    moderationCase: {
      type: Schema.Types.ObjectId,
      ref: "ModerationCase",
      required: true,
      index: true,
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    source: {
      type: String,
      enum: ["USER", "AI", "SYSTEM", "MODERATOR"],
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: [
        "SPAM",
        "HARASSMENT",
        "HATE_SPEECH",
        "MISINFORMATION",
        "IMPERSONATION",
        "VIOLENCE",
        "SELF_HARM",
        "SEXUAL_CONTENT",
        "CHILD_SAFETY",
        "COPYRIGHT",
        "PRIVACY",
        "SCAM",
        "FAKE_ACCOUNT",
        "OTHER",
      ],
      required: true,
      index: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    aiConfidence: {
      type: Number,
      default: null,
      min: 0,
      max: 1,
    },
    aiModel: {
      type: String,
      default: null,
    },
    isDuplicate: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    autoIndex: true,
  },
);

ModerationReportSchema.index({
  moderationCase: 1,
  createdAt: -1,
});
ModerationReportSchema.index({
  reporter: 1,
  createdAt: -1,
});
ModerationReportSchema.index({
  source: 1,
  reason: 1,
});
export const ModerationReportModel: Model<IModerationReport> = model(
  "ModerationReport",
  ModerationReportSchema,
  "moderation_reports",
);

// Eveidence Records
export const ModerationEvidenceSchema = new Schema<IModerationEvidence>(
  {
    moderationCase: {
      type: Schema.Types.ObjectId,
      ref: "ModerationCase",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "TEXT",
        "IMAGE",
        "VIDEO",
        "AUDIO",
        "DOCUMENT",
        "URL",
        "SCREENSHOT",
        "OCR",
        "AI_ANALYSIS",
        "SYSTEM_METADATA",
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: null,
      trim: true,
    },
    content: {
      type: String,
      default: null,
    },
    media: [
      {
        type: Schema.Types.ObjectId,
        ref: "Media",
      },
    ],
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
    collectedBy: {
      type: String,
      enum: ["SYSTEM", "AI", "MODERATOR"],
      required: true,
    },
    collectedByIdentity: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    autoIndex: true,
  },
);
ModerationEvidenceSchema.index({
  moderationCase: 1,
  type: 1,
});
export const ModerationEvidenceModel: Model<IModerationEvidence> = model(
  "ModerationEvidence",
  ModerationEvidenceSchema,
  "moderation_evidence",
);

import { Schema, model, Document, Model, Types } from "mongoose";
import { IMediaModel } from "../../types/media";

export interface IMediaDocument
  extends
    Omit<
      IMediaModel,
      "_id" | "ownerId" | "sourceId" | "createdAt" | "updatedAt"
    >,
    Document {
  ownerId: Types.ObjectId;
  sourceId?: Types.ObjectId | null;
}

const MediaSchema = new Schema<IMediaDocument>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    sourceId: {
      type: Schema.Types.ObjectId,
      required: false,
      refPath: "sourceType",
    },
    sourceType: {
      type: String,
      required: false,
      enum: ["GIST", "STAKE", "USER", "VERIFICATION"],
    },

    // Storage Details
    url: { type: String, required: true },
    thumbnailUrl: { type: String },
    storageProvider: {
      type: String,
      enum: ["S3", "CLOUDINARY", "GCP"],
      default: "S3",
    },
    fileKey: { type: String, required: true },

    // Metadata for UI/UX
    type: { type: String, enum: ["IMAGE", "VIDEO", "GIF"], required: true },
    mimeType: { type: String },
    size: { type: Number },
    dimensions: {
      width: { type: Number },
      height: { type: Number },
      aspectRatio: { type: Number },
    },

    // Performance Optimization
    blurHash: { type: String },
    order: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["UPLOADING", "READY", "ERROR"],
      default: "READY",
    },

    // Moderation log
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

export const MediaModel: Model<IMediaDocument> = model<IMediaDocument>(
  "Media",
  MediaSchema,
  "media",
);

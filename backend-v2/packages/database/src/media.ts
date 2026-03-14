import { Schema, model } from "mongoose";

const MediaSchema = new Schema(
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
  },
  { timestamps: true },
);

// Updated Indexing for the new field names
MediaSchema.index({ sourceId: 1, sourceType: 1, order: 1 });
MediaSchema.index({ ownerId: 1, createdAt: -1 });

export const MediaModel = model("Media", MediaSchema, "media");

import { Schema, model } from "mongoose";

const MediaSchema = new Schema(
  {
    // Link to the creator
    ownerId: { type: Schema.Types.ObjectId, ref: "Users", required: true },

    // Link to the POST
    postId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "postType",
    },
    postType: {
      type: String,
      required: true,
      enum: ["Gists", "Stakes"],
    },

    // Storage Details
    url: { type: String, required: true },
    thumbnailUrl: { type: String },
    storageProvider: {
      type: String,
      enum: ["S3", "CLOUDINARY", "GCP"],
      default: "S3",
    },
    fileKey: { type: String, required: true }, // The path/key in the storage bucket

    // Metadata for UI/UX
    type: { type: String, enum: ["IMAGE", "VIDEO", "GIF"], required: true },
    mimeType: { type: String },
    size: { type: Number }, // in bytes
    dimensions: {
      width: { type: Number },
      height: { type: Number },
      aspectRatio: { type: Number },
    },

    // Performance Optimization
    blurHash: { type: String }, // For showing a blurred preview while loading

    order: { type: Number, default: 0 }, // For carousels: which image comes first?

    status: {
      type: String,
      enum: ["UPLOADING", "READY", "ERROR"],
      default: "READY",
    },
  },
  { timestamps: true },
);

// Indexing for fast retrieval of all media for a specific post
MediaSchema.index({ postId: 1, order: 1 });

export const MediaModel = model("Media", MediaSchema);

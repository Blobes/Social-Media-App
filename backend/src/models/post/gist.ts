import mongoose from "mongoose";

const GistSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    content: String,
    likeCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    status: { type: String, default: "ACTIVE" },

    // Versioning
    versioning: {
      originalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Gist",
        required: true,
      },
      version: { type: Number, default: 1 },
      editCount: { type: Number, default: 0, max: 3 },
      isLatest: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);
// Indexing for high-performance feed retrieval
GistSchema.index({ "versioning.isLatest": 1, createdAt: -1 });
// Indexing for retrieving history of a specific post
GistSchema.index({ "versioning.originalId": 1, "versioning.version": 1 });
GistSchema.index({ authorId: 1, createdAt: -1 });
export const GistModel = mongoose.model("Gists", GistSchema);

// Like Schema
const GistLikeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    gistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gists",
      required: true,
    },
  },
  { timestamps: true },
);
GistLikeSchema.index({ userId: 1, gistId: 1 }, { unique: true });
export const GistLikeModel = mongoose.model("Gist_Likes", GistLikeSchema);

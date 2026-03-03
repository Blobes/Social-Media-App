import { Schema, model } from "mongoose";

const GistSchema = new Schema(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mediaIds: [{ type: Schema.Types.ObjectId, ref: "Media" }],
    latestContent: {
      contentId: {
        type: Schema.Types.ObjectId,
        ref: "PostContent",
      },
      content: String,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    editCount: { type: Number, default: 0, max: 3 },
    status: { type: String, enum: ["ACTIVE", "DELETED"], default: "ACTIVE" },
  },
  { timestamps: true },
);
GistSchema.index({ status: 1, authorId: 1, createdAt: -1 });
export const GistModel = model("Gist", GistSchema, "gists");

// Like Schema
const GistLikeSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    gistId: {
      type: Schema.Types.ObjectId,
      ref: "Gist",
      required: true,
    },
  },
  { timestamps: true },
);
GistLikeSchema.index({ userId: 1, gistId: 1 }, { unique: true });
export const GistLikeModel = model("GistLike", GistLikeSchema, "gist_likes");

import { Schema, model, Types, Model } from "mongoose";
import { IGistLikeDocument } from "../../../types/post";

// Like Schema
const GistLikeSchema = new Schema<IGistLikeDocument>(
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

// Gist Like Schema Indexes
GistLikeSchema.index({ userId: 1, gistId: 1 }, { unique: true });
GistLikeSchema.index({ gistId: 1, createdAt: -1 });

export const GistLikeModel: Model<IGistLikeDocument> = model<IGistLikeDocument>(
  "GistLike",
  GistLikeSchema,
  "gist_likes",
);

import { Schema, model, Types } from "mongoose";

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
  {
    timestamps: true,
    autoIndex: false, // Stop mongodb auto index
  },
);

export const GistLikeModel = model("GistLike", GistLikeSchema, "gist_likes");

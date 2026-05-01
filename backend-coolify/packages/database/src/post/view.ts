import { Schema, model } from "mongoose";

const PostViewSchema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "postType",
    },
    postType: { type: String, required: true, enum: ["GIST", "STAKE"] },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    viewedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    autoIndex: false,
  },
);

export const PostViewModel = model("PostView", PostViewSchema, "post_views");

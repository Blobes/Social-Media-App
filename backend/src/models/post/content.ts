import { Schema, model } from "mongoose";

const PostContentSchema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "postType",
    },
    postType: {
      type: String,
      required: true,
      enum: ["GIST", "STAKE"],
    },
    content: { type: String, required: true },
    version: { type: Number, required: true, default: 1 },
    isLatest: { type: Boolean, default: true },
  },
  { timestamps: true },
);
PostContentSchema.index({ postId: 1, isLatest: 1 });
PostContentSchema.index({ postId: 1, version: -1 });

export const PostContentModel = model(
  "PostContent",
  PostContentSchema,
  "post_contents",
);

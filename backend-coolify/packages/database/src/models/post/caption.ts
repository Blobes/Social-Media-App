import { Schema, model } from "mongoose";

const PostCaptionSchema = new Schema(
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
    caption: { type: String, required: true },
    version: { type: Number, required: true, default: 1 },
    isLatest: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    autoIndex: false, // Stop mongodb auto index
  },
);

export const PostCaptionModel = model(
  "PostCaption",
  PostCaptionSchema,
  "post_captions",
);

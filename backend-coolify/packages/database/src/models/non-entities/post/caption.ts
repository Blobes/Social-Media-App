import { Model, Schema, model } from "mongoose";
import { IPostCaptionDocument } from "../../../types/post";

const PostCaptionSchema = new Schema<IPostCaptionDocument>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "postType",
    },
    postType: {
      type: String,
      required: true,
      enum: ["Gist", "Stake"],
    },
    caption: { type: String, required: true },
    version: { type: Number, required: true, default: 1 },
    isLatest: { type: Boolean, default: true },
    detectedLanguage: { type: String, default: "en" },
  },
  { timestamps: true },
);

// Post Caption Schema Indexes
PostCaptionSchema.index({ postId: 1, version: -1 });
PostCaptionSchema.index(
  { postId: 1, isLatest: 1 },
  { partialFilterExpression: { isLatest: true } },
);

export const PostCaptionModel: Model<IPostCaptionDocument> =
  model<IPostCaptionDocument>(
    "PostCaption",
    PostCaptionSchema,
    "post_captions",
  );

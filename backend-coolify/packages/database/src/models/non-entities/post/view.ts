import { Model, Schema, model } from "mongoose";
import { IPostViewDocument } from "../../../types/post";

const PostViewSchema = new Schema<IPostViewDocument>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "postType",
    },
    postType: { type: String, required: true, enum: ["Gist", "Stake"] },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    viewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Post View Schema Indexes
PostViewSchema.index({ userId: 1, postId: 1 }, { unique: true });
PostViewSchema.index({ postId: 1, viewedAt: -1 });

export const PostViewModel: Model<IPostViewDocument> = model<IPostViewDocument>(
  "PostView",
  PostViewSchema,
  "post_views",
);

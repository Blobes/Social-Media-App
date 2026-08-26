import { Schema, model, Model } from "mongoose";
import { IPostLikeDocument } from "../../../types/post";

/**
 * Mongoose schema definition for Post Like entities.
 */
const PostLikeSchema = new Schema<IPostLikeDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
  },
  { timestamps: true },
);

// Post Like Schema Indexes
PostLikeSchema.index({ userId: 1, postId: 1, postType: 1 }, { unique: true });
PostLikeSchema.index({ postId: 1, postType: 1, createdAt: -1 });

export const PostLikeModel: Model<IPostLikeDocument> = model<IPostLikeDocument>(
  "PostLike",
  PostLikeSchema,
  "post_likes",
);

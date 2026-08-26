import { Schema, model, Model } from "mongoose";
import { ICommentDocument } from "../../../types/post";

const CommentSchema = new Schema<ICommentDocument>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    postId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "postType",
    },
    postType: { type: String, enum: ["Gist", "Stake"], required: true },
    content: { type: String, required: true },
    visibility: {
      type: String,
      enum: ["PUBLIC", "FOLLOWERS", "PRIVATE", "MENTIONED_ONLY"],
      default: "PUBLIC",
    },
    status: {
      type: String,
      enum: ["PUBLISHED", "DELETED", "ARCHIVED", "BANNED", "SHADOWBANNED"],
      default: "PUBLISHED",
    },
  },
  { timestamps: true },
);

// Fetching active comments for a specific post ordered chronologically
CommentSchema.index({ postId: 1, postType: 1, status: 1, createdAt: -1 });
// Fetching comments made by a specific author across posts
CommentSchema.index({ authorId: 1, createdAt: -1 });

export const CommentModel: Model<ICommentDocument> = model<ICommentDocument>(
  "Comment",
  CommentSchema,
  "comments",
);

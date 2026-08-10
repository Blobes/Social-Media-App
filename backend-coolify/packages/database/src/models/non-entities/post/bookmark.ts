import { Model, Schema, model } from "mongoose";
import { IBookmarkDocument } from "../../../types/post";

const BookmarkSchema = new Schema<IBookmarkDocument>(
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

// Bookmark Schema Indexes
BookmarkSchema.index({ userId: 1, postId: 1 }, { unique: true });
BookmarkSchema.index({ userId: 1, createdAt: -1 });

export const BookmarkModel: Model<IBookmarkDocument> = model<IBookmarkDocument>(
  "Bookmark",
  BookmarkSchema,
  "bookmarks",
);

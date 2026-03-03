import { Schema, model } from "mongoose";

const BookmarkSchema = new Schema(
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

// Keep your unique index to prevent duplicate bookmarks
BookmarkSchema.index({ userId: 1, postId: 1 }, { unique: true });
export const BookmarkModel = model("Bookmark", BookmarkSchema, "bookmarks");

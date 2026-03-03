import mongoose from "mongoose";

const BookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "postType",
    },
    postType: {
      type: String,
      required: true,
      enum: ["Gists", "Stakes"],
    },
  },
  { timestamps: true },
);

// Keep your unique index to prevent duplicate bookmarks
BookmarkSchema.index({ userId: 1, postId: 1 }, { unique: true });
export const BookmarkModel = mongoose.model("Bookmarks", BookmarkSchema);

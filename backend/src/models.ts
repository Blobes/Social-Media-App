import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      required: true,
    },
    phoneNumber: String,
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    verificationCode: String, // hashed code
    verificationExpiry: Date,
    gender: String,
    dateOfBirth: String,
    profileImage: String,
    coverImage: String,
    about: String,
    location: String,
    onboardingStep: {
      type: String,
      default: null,
    },
    country: { type: String, default: null },
    state: { type: String, default: null },
    occupation: String,
    relationship: String,
    interests: [],
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
      },
    ],
  },
  { timestamps: true }
);
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true, sparse: true });
export const UserModel = mongoose.model("Users", userSchema);

//Post Schema
const postSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    content: String,
    postImage: String,
    likeCount: {
      type: Number,
      default: 0,
    },
    status: { type: String, default: "ACTIVE" },
  },
  { timestamps: true }
);
postSchema.index({ authorId: 1, createdAt: -1 });
export const PostModel = mongoose.model("Posts", postSchema);

// Post Like Schema
const postLikeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Posts",
      required: true,
    },
  },
  { timestamps: true }
);
postLikeSchema.index({ userId: 1, postId: 1 }, { unique: true });
export const PostLikeModel = mongoose.model("Post_Likes", postLikeSchema);

// Post Bookmark Schema
const bookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Posts",
      required: true,
    },
  },
  { timestamps: true }
);
bookmarkSchema.index({ userId: 1, postId: 1 }, { unique: true });
export const BookmarkModel = mongoose.model("Bookmarks", bookmarkSchema);

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

export const UserModel = mongoose.model("Users", userSchema);

//Post Schema
const postSchema = new mongoose.Schema(
  {
    authorId: {
      type: String,
      required: true,
    },
    content: String,
    postImage: String,
    likes: [],
    status: String,
  },
  { timestamps: true }
);
export const PostModel = mongoose.model("Posts", postSchema);

import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    username: {
      type: String,
      required: function (this: any) {
        return this.isEmailVerified;
      },
      unique: true,
    },
    firstName: {
      type: String,
      required: function (this: any) {
        return this.isEmailVerified;
      },
    },
    lastName: {
      type: String,
      required: function (this: any) {
        return this.isEmailVerified;
      },
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    profileImage: String,
    coverImage: String,
    about: String,
    location: String,
    worksAt: String,
    relationship: String,
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
  },
  { timestamps: true }
);
export const PostModel = mongoose.model("Posts", postSchema);

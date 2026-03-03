import { Schema, model } from "mongoose";

const UserSchema = new Schema(
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
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true, sparse: true });
export const UserModel = model("User", UserSchema, "users");

import { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    // --- 1. CORE IDENTITY ---
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      default: null,
    },

    // --- 2. VERIFICATION & NOTABILITY ---
    isVerified: { type: Boolean, default: false },
    isPublicFigure: { type: Boolean, default: false },
    meritsVerification: { type: Boolean, default: false },
    isNotable: { type: Boolean, default: false },

    idVerificationRequest: {
      type: Schema.Types.ObjectId,
      ref: "IdVerificationRequest",
      default: null,
    },
    // The "State" of the verification process
    idVerificationStatus: {
      type: String,
      enum: ["NONE", "PENDING", "APPROVED", "REJECTED"],
      default: "NONE",
    },

    verificationSignals: {
      hasWikipedia: { type: Boolean, default: false },
      isVipEmail: { type: Boolean, default: false },
      isVipPhone: { type: Boolean, default: false },
    },

    // --- 3. AUTHENTICATION & SECURITY ---
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["USER", "ADMIN", "MODERATOR"],
      default: "USER",
    },
    accountStatus: {
      type: String,
      enum: ["ACTIVE", "DEACTIVATED", "SUSPENDED", "BANNED"],
      default: "ACTIVE",
    },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    verificationCode: String,
    verificationExpiry: Date,
    lastEmailCodeSentAt: { type: Date, default: null },

    // --- 4. IDENTITY UPDATES (PENDING CHANGES) ---
    pendingEmail: { type: String, default: null, lowercase: true },
    lastEmailChangeAt: { type: Date, default: null },
    pendingPhoneNumber: { type: String, default: null },
    lastPhoneChangeAt: { type: Date, default: null },
    lastPhoneCodeSentAt: { type: Date, default: null },
    lastUsernameChangeAt: { type: Date, default: null },

    // --- 5. MODERATION & COMPLIANCE ---
    suspensionExpiresAt: { type: Date, default: null },
    moderationStrikes: { type: Number, default: 0 },
    suspensionReason: { type: String, default: null },

    // --- 6. PROFILE DETAILS ---
    gender: { type: String, default: null },
    dateOfBirth: { type: String, default: null },
    about: { type: String, default: null },
    occupation: { type: String, default: null },
    relationship: { type: String, default: null },
    interests: { type: [String], default: [] },
    website: { type: String, default: null },

    // --- 7. ASSETS (MEDIA REFERENCES) ---
    profileImage: { type: Schema.Types.ObjectId, ref: "Media", default: null },
    coverImage: { type: Schema.Types.ObjectId, ref: "Media", default: null },

    // --- 8. ONBOARDING & GEOGRAPHY ---
    onboardingStep: { type: String, default: null },
    location: { type: String, default: null },
    country: { type: String, default: null },
    state: { type: String, default: null },

    // --- 9. SOCIAL METRICS ---
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    preferredTopics: [
      {
        topicId: { type: Schema.Types.ObjectId, ref: "Topic" },
        title: String,
        lastViewed: Date,
      },
    ],

    // --- 10. LIFECYCLE MANAGEMENT ---
    isDeactivated: { type: Boolean, default: false, index: true },
    deactivatedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

UserSchema.index({
  meritsVerification: 1,
  isPublicFigure: 1,
  isEmailVerified: 1,
});
UserSchema.index({ followersCount: 1 });
UserSchema.index({ createdAt: 1 });

// Middleware for soft-deactivation filtering
const autoFilterDeactivated = function (this: any, next: any) {
  if (this.getOptions?.()?.skipFilter) return next();
  this.where({ isDeactivated: { $ne: true } });
  next();
};

UserSchema.pre(/^find/, autoFilterDeactivated as any);

export const UserModel = model("User", UserSchema, "users");

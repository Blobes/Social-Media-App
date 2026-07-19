import { Schema, model, Model } from "mongoose";
import { IUserDocument } from "../../types/user";

/**
 * User schema & Model
 */
const IUserSchema = new Schema<IUserDocument>(
  {
    // --- CORE IDENTITY ---
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
    usernameCanonical: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    password: { type: String, required: true, default: null },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      sparse: true,
      unique: true,
    },

    // --- AUTHENTICATION & SECURITY ---
    signedUpWith: {
      type: String,
      enum: ["EMAIL", "GOOGLE", "APPLE"],
      default: "EMAIL",
    },
    oAuthId: { type: String, default: null },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    lastPasswordVerifiedAt: { type: Date, default: null },
    twoFactorAuth: {
      secret: { type: String, default: null },
      isEnabled: { type: Boolean, default: false },
      backupCodes: { type: [String], default: [] },
      tempSecret: { type: String, default: null },
      tempBackupCodes: { type: [String], default: [] },
    },

    // --- OTP VERIFICATION ---
    otpCode: { type: String, default: null },
    otpCodeExpiresAt: { type: Date, default: null },
    lastEmailCodeSentAt: { type: Date, default: null },
    lastPhoneCodeSentAt: { type: Date, default: null },

    // --- IDENTITY UPDATES ---
    pendingEmail: { type: String, default: null, lowercase: true },
    lastEmailChangeAt: { type: Date, default: null },
    lastPhoneChangeAt: { type: Date, default: null },
    lastUsernameChangeAt: { type: Date, default: null },
    pendingPhoneNumber: { type: String, default: null },

    // --- ACCOUNT STATUS UPDATES ---
    accountStatus: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "DEACTIVATED", "SUSPENDED", "BANNED"],
      default: "ACTIVE",
    },
    lastActiveAt: { type: Date, default: null },
    statusChangedAt: {
      type: Date,
      default: Date.now,
    },
    statusReason: {
      type: String,
      default: null,
    },
    statusChangedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deactivatedAt: { type: Date, default: null },

    // --- VERIFICATION & NOTABILITY ---
    isVerified: { type: Boolean, default: false },
    isPublicFigure: { type: Boolean, default: false },
    meritsVerification: { type: Boolean, default: false },
    isNotable: { type: Boolean, default: false },
    idVerificationRequest: {
      type: Schema.Types.ObjectId,
      ref: "IdVerificationRequest",
      default: null,
    },
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
    isAgeVerified: { type: Boolean, default: false },

    // --- USER DEVICES ---
    primaryDeviceId: {
      type: Schema.Types.ObjectId,
      ref: "Device",
      default: null,
    },

    // --- MODERATION & COMPLIANCE ---
    policyBreachCount: { type: Number, default: 0 }, // A simple counter for how many times they've breached policy historically
    hasFlaggedPost: { type: Boolean, default: false },
    postCountWindow: { type: Number, default: 0, index: true },

    // --- PROFILE DETAILS ---
    gender: { type: String, default: null },
    dateOfBirth: { type: String, default: null },
    about: { type: String, default: null },
    occupation: { type: String, default: null },
    relationship: { type: String, default: null },
    interests: { type: [String], default: [] },
    website: { type: String, default: null },

    // --- PROFILE ASSETS ---
    profileImage: { type: Schema.Types.ObjectId, ref: "Media", default: null },
    coverImage: { type: Schema.Types.ObjectId, ref: "Media", default: null },

    // --- ONBOARDING & GEOGRAPHY ---
    isOnboarded: { type: Boolean, default: false },
    onboardingStep: { type: String, default: null },
    location: { type: String, default: null },
    country: { type: String, default: null },
    state: { type: String, default: null },

    // --- METRICS & PREFERENCES ---
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    preferences: {
      preferredTopics: [
        {
          topicId: { type: Schema.Types.ObjectId, ref: "Topic" },
          title: String,
          lastViewed: Date,
        },
      ],
      showSensitiveGraphic: { type: Boolean, default: false },
      preferredLanguage: { type: String, default: "en" },
    },
  },
  {
    timestamps: true,
    autoIndex: true, // Enabled index for primaryDeviceId lookup efficiency
    toJSON: {
      virtuals: true,
      transform: (doc, ret: any) => {
        ret._id = ret._id.toString();
        delete ret.password;
        delete ret.verificationCode;
        return ret;
      },
    },
  },
);

export const UserModel: Model<IUserDocument> = model<IUserDocument>(
  "User",
  IUserSchema,
  "users",
);

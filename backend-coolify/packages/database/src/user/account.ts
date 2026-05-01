import { Document, Schema, Types, model, Model } from "mongoose";
import { IUserModel } from "../model-types/user";

/**
 * Backend-only Document Interface.
 * Includes sensitive fields like password and moderation state.
 */
export interface IUserDocument
  extends Omit<IUserModel, "_id" | "createdAt" | "updatedAt">, Document {
  password: string;
  verificationCode?: string | null;
  verificationExpiry?: Date | null;
  idVerificationRequest?: Types.ObjectId | null;
  moderationStrikes: number;
  suspensionExpiresAt?: Date | null;
  suspensionReason?: string | null;
  // Mongoose managed timestamps
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
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
      sparse: true,
      unique: true,
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
    verificationCode: { type: String, default: null },
    verificationExpiry: { type: Date, default: null },
    lastEmailCodeSentAt: { type: Date, default: null },
    primarySessionId: { type: String, default: null },

    // Devices
    primaryDeviceId: { type: String, default: null, index: true },
    trustedDevices: [
      {
        deviceId: { type: String, required: true },
        lastVerifiedAt: { type: Date, default: Date.now },
        name: { type: String, default: "Secondary Device" },
      },
    ],

    // --- 4. IDENTITY UPDATES ---
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

    // --- 7. ASSETS ---
    profileImage: { type: Schema.Types.ObjectId, ref: "Media", default: null },
    coverImage: { type: Schema.Types.ObjectId, ref: "Media", default: null },

    // --- 8. ONBOARDING & GEOGRAPHY ---
    isOnboarded: { type: Boolean, default: false },
    onboardingStep: { type: String, default: null },
    location: { type: String, default: null },
    country: { type: String, default: null },
    state: { type: String, default: null },

    // --- 9. SOCIAL METRICS ---
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

    // --- 10. LIFECYCLE MANAGEMENT ---
    isDeactivated: { type: Boolean, default: false },
    deactivatedAt: { type: Date, default: null },
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
  UserSchema,
);

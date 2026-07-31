import { Schema, model } from "mongoose";
import { IUserDocument, IUserModelStatic, QueryConfig } from "../../types/user";
import { encryptedFieldsPlugin } from "../../helpers/encryptionPlugin";
import { schemaSyncPlugin } from "../../migration/schemaSyncPlugin";

/**
 * User schema
 */
const UserSchema = new Schema<IUserDocument, IUserModelStatic>(
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
    lastEmailOtpSentAt: { type: Date, default: null },
    lastPhoneOtpSentAt: { type: Date, default: null },

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
    address: { type: String, default: null },

    // --- PROFILE ASSETS ---
    profileImage: { type: Schema.Types.ObjectId, ref: "Media", default: null },
    coverImage: { type: Schema.Types.ObjectId, ref: "Media", default: null },

    // --- ONBOARDING & GEOGRAPHY ---
    isOnboarded: { type: Boolean, default: false },
    onboardingStep: { type: String, default: null },

    // --- ACCOUNT LOCATION ---
    location: {
      name: { type: String, default: null },
      city: { type: String, default: null },
      state: { type: String, default: null },
      country: { type: String, default: null },
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        index: "2dsphere",
        default: [],
      },
    },

    // --- METRICS & PREFERENCES ---
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    // preferences: {
    //   preferredTopics: {
    //     type: [
    //       {
    //         topicId: { type: Schema.Types.ObjectId, ref: "Topic" },
    //         title: String,
    //         lastViewed: Date,
    //       },
    //     ],
    //     default: [],
    //   },
    //   showSensitiveGraphic: { type: Boolean, default: false },
    //   preferredLanguage: { type: String, default: "en" },
    // },
  },
  {
    timestamps: true,
    autoIndex: true, // Enabled index for primaryDeviceId lookup efficiency
    toJSON: {
      virtuals: true,
      transform: (doc, ret: any) => {
        ret._id = ret._id.toString();
        delete ret.password;
        delete ret.otpCode;
        return ret;
      },
    },
  },
);

// Register the new schema sync plugin BEFORE any other plugins that might modify fields based on defaults
UserSchema.plugin(schemaSyncPlugin);

// Register plugin to automate configuration transformations transparently
UserSchema.plugin(encryptedFieldsPlugin, {
  fields: [
    { field: "email", searchable: true },
    { field: "phoneNumber", searchable: true },
  ],
});

/**
 * Model helper method lookup abstraction for profile email match operations.
 */
UserSchema.statics.findByEmail = function (
  this: IUserModelStatic,
  config: QueryConfig & { email: string },
) {
  const { email, filter, options } = config;
  return this.findByEncryptedField("email", email, filter, options);
};

// Model helper method lookup abstraction for profile phone number match operations.
UserSchema.statics.findByPhone = function (
  this: IUserModelStatic,
  config: QueryConfig & { phoneNumber: string },
) {
  const { phoneNumber, filter, options } = config;
  return this.findByEncryptedField("phoneNumber", phoneNumber, filter, options);
};

export const UserModel = model<IUserDocument, IUserModelStatic>(
  "User",
  UserSchema,
  "users",
);

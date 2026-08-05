import { model, Schema } from "mongoose";
import { IUserSettingsDocument } from "../../../types/user";
import { IUserPreferredTopic } from "../../../types/topic";

/**
 * Schema defining topic preference tracking subdocument.
 */
const PreferredTopicSchema = new Schema<IUserPreferredTopic>(
  {
    topicId: {
      type: Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    lastViewed: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

/**
 * Model schema for persistent global user settings.
 */
const UserSettingsSchema = new Schema<IUserSettingsDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    privacy: {
      isPrivateAccount: { type: Boolean, default: false },
      discoverability: {
        searchIndexing: { type: Boolean, default: true },
        contactSync: { type: Boolean, default: true },
        recommendToOthers: { type: Boolean, default: true },
      },
      directMessaging: {
        type: String,
        enum: ["EVERYONE", "FOLLOWERS", "NO_ONE"],
        default: "EVERYONE",
      },
      mentionsAndTagging: {
        type: String,
        enum: ["EVERYONE", "FOLLOWERS", "NO_ONE"],
        default: "EVERYONE",
      },
    },
    notifications: {
      push: {
        enabled: { type: Boolean, default: true },
        likes: { type: Boolean, default: true },
        comments: { type: Boolean, default: true },
        mentions: { type: Boolean, default: true },
        newFollowers: { type: Boolean, default: true },
        directMessages: { type: Boolean, default: true },
        systemAnnouncements: { type: Boolean, default: true },
      },
      email: {
        enabled: { type: Boolean, default: true },
        digest: { type: Boolean, default: false },
        directMessages: { type: Boolean, default: true },
        securityAlerts: { type: Boolean, default: true },
      },
      quietMode: {
        isEnabled: { type: Boolean, default: false },
        startTime: { type: String, default: "22:00" },
        endTime: { type: String, default: "07:00" },
        timeZone: { type: String, default: "UTC" },
      },
    },
    display: {
      theme: {
        type: String,
        enum: ["SYSTEM", "LIGHT", "DARK"],
        default: "SYSTEM",
      },
      showSensitiveMedia: { type: Boolean, default: false },
      accessibility: {
        reduceMotion: { type: Boolean, default: false },
        highContrast: { type: Boolean, default: false },
        fontScale: { type: Number, default: 1.0 },
        autoPlayMedia: {
          type: String,
          enum: ["ALWAYS", "WIFI_ONLY", "NEVER"],
          default: "ALWAYS",
        },
      },
      localization: {
        language: { type: String, default: "en" },
        region: { type: String, default: "US" },
        currency: { type: String, default: "USD" },
      },
      contentPreferences: {
        preferredTopics: {
          type: [PreferredTopicSchema],
          default: [],
        },
        mutedWords: {
          type: [String],
          default: [],
        },
      },
    },
  },
  {
    timestamps: true,
  },
);

/**
 * --- INDEX STRATEGY ---
 *
 * 1. Unique index on `userId` handles fast settings lookup during profile loads and authentication.
 * 2. Partial index on `privacy.discoverability.recommendToOthers` optimizes background user recommendation engine jobs.
 * 3. Partial index on `notifications.quietMode.isEnabled` allows workers to efficiently process active quiet mode schedules during push delivery.
 */

UserSettingsSchema.index(
  { "privacy.discoverability.recommendToOthers": 1 },
  {
    partialFilterExpression: {
      "privacy.discoverability.recommendToOthers": true,
    },
  },
);

UserSettingsSchema.index(
  { "notifications.quietMode.isEnabled": 1 },
  { partialFilterExpression: { "notifications.quietMode.isEnabled": true } },
);

export const UserSettingsModel = model<IUserSettingsDocument>(
  "UserSettings",
  UserSettingsSchema,
  "user_settings",
);

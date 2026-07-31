import {
  Document,
  Model,
  Query,
  Types,
  QueryOptions,
  QueryFilter,
} from "mongoose";
import { AccountStatus, ITfaData, VerificationStatus } from "./status";
import { IUserPreferredTopic } from "./topic";

export interface ILocation {
  name?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface IUserDocument extends Document {
  // --- CORE IDENTITY ---
  email: string;
  emailHash?: string;
  username?: string;
  usernameCanonical?: string;
  password: string | null;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  phoneNumberHash?: string;

  // --- AUTHENTICATION & SECURITY ---
  signedUpWith?: "EMAIL" | "GOOGLE" | "APPLE";
  oAuthId?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  primaryDeviceId?: Types.ObjectId | string | null;
  lastPasswordVerifiedAt?: Date | null;
  twoFactorAuth: ITfaData;

  // --- OTP VERIFICATION ---
  otpCode?: string | null;
  otpCodeExpiresAt?: Date | null;
  lastEmailOtpSentAt?: Date | null;
  lastPhoneOtpSentAt: Date | null;

  // --- IDENTITY UPDATES ---
  pendingEmail?: string | null;
  pendingPhoneNumber?: string | null;
  lastEmailChangeAt?: Date | null;
  lastPhoneChangeAt?: Date | null;
  lastUsernameChangeAt?: Date | null;

  // --- ID VERIFICATION & NOTABILITY ---
  isVerified: boolean;
  isPublicFigure: boolean;
  meritsVerification: boolean;
  isNotable: boolean;
  idVerificationRequest?: Types.ObjectId | null;
  idVerificationStatus: VerificationStatus;
  verificationSignals: {
    hasWikipedia: boolean;
    isVipEmail: boolean;
    isVipPhone: boolean;
  };
  isAgeVerified: boolean;

  // --- ACCOUNT STATUS UPDATES ---
  accountStatus: AccountStatus;
  lastActiveAt?: Date | null;
  statusChangedAt?: Date | null;
  statusReason?: string;
  statusChangedBy?: Types.ObjectId | null;
  deactivatedAt?: Date | null;

  // --- PROFILE DETAILS ---
  gender?: string | null;
  dateOfBirth?: string | null;
  about?: string | null;
  occupation?: string | null;
  relationship?: string | null;
  interests: string[];
  website?: string | null;
  address?: string | null; // Provided by user

  // --- PROFILE ASSETS ---
  profileImage?: string | null;
  coverImage?: string | null;

  // --- ONBOARDING & GEOGRAPHY ---
  isOnboarded?: boolean;
  onboardingStep?: string | null;

  // --- ACCOUNT LOCATION ---
  location?: ILocation | null;

  // --- METRICS & PREFERENCES ---
  followersCount: number;
  followingCount: number;
  // preferences: {
  //   showSensitiveGraphic: boolean;
  //   preferredLanguage: string;
  //   preferredTopics: Array<{
  //     topicId: string;
  //     title: string;
  //     lastViewed?: Date | null;
  //   }>;
  // };

  // --- MODERATION FIELDS ---
  policyBreachCount?: number;
  hasFlaggedPost: boolean;
  postCountWindow: number;

  // --- LIFECYCLE ---
  createdAt: Date | null;
  updatedAt: Date | null;
}

export type QFilter = QueryFilter<IUserDocument>;

export interface QueryConfig {
  filter?: QFilter;
  options?: QueryOptions;
}
export interface IUserModelStatic extends Model<IUserDocument> {
  findByEncryptedField(
    fieldName: string,
    plainValue: string,
    filter?: QFilter,
    options?: QueryOptions,
  ): Query<IUserDocument | null, IUserDocument>;
  findByEmail(
    config: QueryConfig & { email: string },
  ): Query<IUserDocument | null, IUserDocument>;
  findByPhone(
    config: QueryConfig & { phoneNumber: string },
  ): Query<IUserDocument | null, IUserDocument>;
}

/**
 * Interface defining granular global user settings.
 */
export interface IUserSettingsDocument {
  userId: Types.ObjectId;
  privacy: {
    isPrivateAccount: boolean;
    discoverability: {
      searchIndexing: boolean;
      contactSync: boolean;
      recommendToOthers: boolean;
    };
    directMessaging: "EVERYONE" | "FOLLOWERS" | "NO_ONE";
    mentionsAndTagging: "EVERYONE" | "FOLLOWERS" | "NO_ONE";
  };
  notifications: {
    push: {
      enabled: boolean;
      likes: boolean;
      comments: boolean;
      mentions: boolean;
      newFollowers: boolean;
      directMessages: boolean;
      systemAnnouncements: boolean;
    };
    email: {
      enabled: boolean;
      digest: boolean;
      directMessages: boolean;
      securityAlerts: boolean;
    };
    quietMode: {
      isEnabled: boolean;
      startTime: string; // HH:mm format, e.g., "22:00"
      endTime: string; // HH:mm format, e.g., "07:00"
      timeZone: string; // e.g., "Africa/Lagos" or "UTC"
    };
  };
  display: {
    theme: "SYSTEM" | "LIGHT" | "DARK";
    showSensitiveMedia: boolean;
    accessibility: {
      reduceMotion: boolean;
      highContrast: boolean;
      fontScale: number;
      autoPlayMedia: "ALWAYS" | "WIFI_ONLY" | "NEVER";
    };
    localization: {
      language: string;
      region: string;
      currency: string;
    };
    contentPreferences: {
      preferredTopics: IUserPreferredTopic[];
      mutedWords: string[];
    };
  };
  mutedWords: string[];
}

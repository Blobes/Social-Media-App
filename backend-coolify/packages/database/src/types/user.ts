import { Document, Types } from "mongoose";
import { AccountStatus, ITfaData, VerificationStatus } from "./status";

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

  // --- PROFILE ASSETS ---
  profileImage?: string | null;
  coverImage?: string | null;

  // --- ONBOARDING & GEOGRAPHY ---
  isOnboarded?: boolean;
  onboardingStep?: string | null;
  location?: string | null;
  country?: string | null;
  state?: string | null;

  // --- METRICS & PREFERENCES ---
  followersCount: number;
  followingCount: number;
  preferences: {
    showSensitiveGraphic: boolean;
    preferredLanguage: string;
    preferredTopics: Array<{
      topicId: string;
      title: string;
      lastViewed?: Date | null;
    }>;
  };

  // --- MODERATION FIELDS ---
  policyBreachCount?: number;
  hasFlaggedPost: boolean;
  postCountWindow: number;

  // --- LIFECYCLE ---
  createdAt: Date | null;
  updatedAt: Date | null;
}

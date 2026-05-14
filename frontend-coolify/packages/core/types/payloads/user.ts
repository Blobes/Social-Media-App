import { StepName } from "../ui-state";

export type UserRole = "USER" | "ADMIN" | "MODERATOR";
export type AccountStatus =
  | "PENDING"
  | "ACTIVE"
  | "DEACTIVATED"
  | "SUSPENDED"
  | "BANNED"
  | "NOT_ONBOARDED";
export type VerificationStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

/**
 * Interface representing the Device document in MongoDB.
 */
export interface ITrustedDevice {
  _id?: string;
  userId: string;
  deviceToken: string;
  name: string | null;
  deviceType?: string;
  os?: string;
  browser?: string;
  userAgent?: string;
  ipHash?: string;
  lastCountry?: string;
  isPrimary: boolean;
  isStale: boolean;
  lastSeenAt: Date;
  lastVerifiedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPayload {
  _id?: string;

  // --- 1. CORE IDENTITY ---
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;

  // --- 2. VERIFICATION & NOTABILITY ---
  isVerified?: boolean;
  isPublicFigure?: boolean;
  meritsVerification?: boolean;
  isNotable?: boolean;
  idVerificationStatus?: VerificationStatus;
  verificationSignals?: {
    hasWikipedia: boolean;
    isVipEmail: boolean;
    isVipPhone: boolean;
  };
  isAgeVerified?: boolean;

  // --- 3. AUTHENTICATION & SECURITY (Wire-safe) ---
  role?: UserRole;
  accountStatus?: AccountStatus;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  lastEmailCodeSentAt?: Date | string | null;
  primaryDeviceId?: string | null;
  trustedDevices?: ITrustedDevice[];

  // --- 4. IDENTITY UPDATES (NEWLY ADDED) ---
  pendingEmail?: string | null;
  lastEmailChangeAt?: Date | string | null;
  pendingPhoneNumber?: string | null;
  lastPhoneCodeSentAt?: Date | string | null;
  lastPhoneChangeAt?: Date | string | null;
  lastUsernameChangeAt?: Date | string | null;

  // --- 5. PROFILE DETAILS ---
  gender?: string | null;
  dateOfBirth?: string | null;
  about?: string | null;
  occupation?: string | null;
  relationship?: string | null;
  interests?: string[];
  website?: string | null;

  // --- 6. ASSETS ---
  profileImage?: string | null; // Usually returned as a URL string or ID string
  coverImage?: string | null;

  // --- 7. ONBOARDING & GEOGRAPHY (NEWLY ADDED) ---
  isOnboarded?: boolean;
  onboardingStep?: StepName | null;
  location?: string | null;
  country?: string | null;
  state?: string | null;

  // --- 8. METRICS & PREFERENCES ---
  followersCount?: number;
  followingCount?: number;
  preferences?: {
    showSensitiveGraphic: boolean;
    preferredLanguage: string;
    preferredTopics: Array<{
      topicId: string;
      title: string;
      lastViewed?: string | null;
    }>;
  };

  // --- 9. LIFECYCLE ---
  isDeactivated?: boolean;
  deactivatedAt?: string | null; // NEWLY ADDED
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

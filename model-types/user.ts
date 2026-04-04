export type UserRole = "USER" | "ADMIN" | "MODERATOR";
export type AccountStatus = "ACTIVE" | "DEACTIVATED" | "SUSPENDED" | "BANNED";
export type VerificationStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export interface IUserModel {
  _id: string;

  // --- 1. CORE IDENTITY ---
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;

  // --- 2. VERIFICATION & NOTABILITY ---
  isVerified: boolean;
  isPublicFigure: boolean;
  meritsVerification: boolean;
  isNotable: boolean;
  idVerificationStatus: VerificationStatus;
  verificationSignals: {
    hasWikipedia: boolean;
    isVipEmail: boolean;
    isVipPhone: boolean;
  };
  isAgeVerified: boolean;

  // --- 3. AUTHENTICATION & SECURITY (Wire-safe) ---
  role: UserRole;
  accountStatus: AccountStatus;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  lastEmailCodeSentAt?: string | null;
  primarySessionId?: string | null;

  // --- 4. IDENTITY UPDATES (NEWLY ADDED) ---
  pendingEmail?: string | null;
  lastEmailChangeAt?: string | null;
  pendingPhoneNumber?: string | null;
  lastPhoneCodeSentAt: string | null;
  lastPhoneChangeAt?: string | null;
  lastUsernameChangeAt?: string | null;

  // --- 5. PROFILE DETAILS ---
  gender?: string | null;
  dateOfBirth?: string | null;
  about?: string | null;
  occupation?: string | null;
  relationship?: string | null;
  interests: string[];
  website?: string | null;

  // --- 6. ASSETS ---
  profileImage?: string | null; // Usually returned as a URL string or ID string
  coverImage?: string | null;

  // --- 7. ONBOARDING & GEOGRAPHY (NEWLY ADDED) ---
  onboardingStep?: string | null;
  location?: string | null;
  country?: string | null;
  state?: string | null;

  // --- 8. METRICS & PREFERENCES ---
  followersCount: number;
  followingCount: number;
  preferences: {
    showSensitiveGraphic: boolean;
    preferredLanguage: string;
    preferredTopics: Array<{
      topicId: string;
      title: string;
      lastViewed?: string | null;
    }>;
  };

  // --- 9. LIFECYCLE ---
  isDeactivated: boolean;
  deactivatedAt?: string | null; // NEWLY ADDED
  createdAt: string;
  updatedAt: string;
}

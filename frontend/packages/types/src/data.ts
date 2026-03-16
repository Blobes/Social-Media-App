"use client";

import { Direction } from "./ui-props";

// Types
export type AuthStatus =
  | "UNKNOWN"
  | "AUTHENTICATED"
  | "UNAUTHENTICATED"
  | "PENDING"
  | "ERROR";
export type NetworkStatus = "STABLE" | "UNSTABLE" | "OFFLINE" | "UNKNOWN";
export type UIMode = "ONLINE" | "OFFLINE";
export type DateType = "SHORTENED" | "COMPLETE" | "DATE-ONLY";
export type FetchStatus = "SUCCESS" | "ERROR" | "INFO" | "WARNING" | null;
export type UserRole = "USER" | "ADMIN" | "MODERATOR";
export type AccountStatus = "ACTIVE" | "DEACTIVATED";
export type InputType = "EMAIL" | "PHONE" | "PASSWORD" | "USERNAME" | "NUMBER";
export type InputStatus = "VALID" | "INVALID";
export type IMediaType = "IMAGE" | "VIDEO" | "GIF";

export type MediaUploadStatus = "UPLOADING" | "READY" | "ERROR";
export type StorageProvider = "S3" | "CLOUDINARY" | "GCP";
export type MediaSourceType = "GIST" | "STAKE" | "USER" | "VERIFICATION";

// Interfaces
export type GenericObject<T> = {
  [key: string]: T | GenericObject<T>;
};

export interface IMedia {
  _id?: string;
  // --- OWNERSHIP & LINKING ---
  ownerId?: string;
  sourceId?: string | null;
  sourceType?: MediaSourceType | null;

  // --- STORAGE DETAILS ---
  url: string;
  fileKey?: string;
  thumbnailUrl?: string | null;
  storageProvider?: StorageProvider;

  // --- METADATA & UI/UX ---
  type?: IMediaType;
  mimeType?: string | null;
  size?: number | null;
  dimensions?: {
    width: number;
    height: number;
    aspectRatio: number;
  };

  // --- PERFORMANCE & ORDERING ---
  blurHash?: string | null;
  order?: number;
  status?: MediaUploadStatus;

  // --- FRONTEND SPECIFIC (NON-PERSISTED) ---
  alt?: string;
  viewMode?: "LIST" | "ISOLATED";

  // --- TIMESTAMPS ---
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IUser {
  _id: string;
  // --- CORE IDENTITY ---
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;

  // --- UPDATE CORE IDENTITY ---
  pendingEmail?: string | null;
  lastEmailChangeAt?: string | Date | null;

  // --- AUTHENTICATION & SECURITY ---
  password?: string; // Excluded in most API responses for security
  role: UserRole;
  accountStatus: AccountStatus;
  isEmailVerified: boolean;
  verificationCode?: string;
  verificationExpiry?: string | Date;
  lastEmailCodeSentAt?: string | Date | null;
  isPhoneVerified: boolean;

  // --- PROFILE DETAILS ---
  gender?: string | null;
  dateOfBirth?: string | null;
  about?: string | null;
  occupation?: string | null;
  relationship?: string | null;
  interests: string[];
  website?: string | null;

  // --- PROFILE ASSETS ---
  profileImage?: string | IMedia | null;
  coverImage?: string | IMedia | null;

  // --- ONBOARDING & LOCATION ---
  onboardingStep?: string | null;
  location?: string | null;
  country?: string | null;
  state?: string | null;

  // --- SOCIAL METRICS ---
  followersCount: number;
  followingCount: number;

  // --- DELETING USER ACCOUNT ---
  isDeleted: boolean;
  deletedAt?: string | Date | null;

  // --- TIMESTAMPS ---
  createdAt?: string;
  updatedAt?: string;
}

export interface INavItem {
  title?: string;
  element?: React.ReactNode;
  url?: string;
  action?: () => void;
}

export interface INavBar {
  setLastPage: (page: IPage) => void;
  list: INavItem[];
}

export interface IListItem {
  item: React.ReactNode | string;
  action?: () => void | null;
}

export interface IMessage {
  id?: number;
  title?: string | null;
  content?: string | null;
  msgStatus?: FetchStatus;
  behavior?: "FIXED" | "TIMED";
  duration?: number;
  hasClose?: boolean;
  cta?: {
    label: string;
    action: () => void;
  };
}

export interface ISnackBarMsg {
  messages?: IMessage[];
  defaultDur: number;
  dir?: Direction;
}

export interface ISingleResponse<T> {
  message: string;
  payload: T | null;
  status: FetchStatus;
}

export interface IListResponse<T> {
  message: string;
  payload: T[] | null;
  status: FetchStatus;
}

export interface InputValidation {
  status: InputStatus;
  message?: string;
  type?: InputType;
}

export interface IStep<T> {
  name: T;
  element: React.ReactNode;
  action?: () => void;
  allowPrevious?: boolean;
}

export interface IPage {
  title: string;
  path: string;
}

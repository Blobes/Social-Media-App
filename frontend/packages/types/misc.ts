"use client";

// Types
export type AuthStatus =
  | "UNKNOWN"
  | "AUTHENTICATED"
  | "UNAUTHENTICATED"
  | "PENDING"
  | "ERROR";
export type NetworkStatus = "STABLE" | "UNSTABLE" | "OFFLINE" | "UNKNOWN";
export type Direction = "LEFT" | "RIGHT" | "UP" | "DOWN";
export type UIMode = "ONLINE" | "OFFLINE";
export type DateType = "SHORTENED" | "COMPLETE" | "DATE-ONLY";
export type SnackbarStatus = "SUCCESS" | "ERROR" | "INFO" | "WARNING" | null;

// Interfaces
export type GenericObject<T> = {
  [key: string]: T | GenericObject<T>;
};

export interface IUser {
  _id: string;
  email?: string;
  isEmailVerified?: boolean;
  password?: string; // Often excluded on frontend for security
  phoneNumber?: string;
  isPhoneVerified?: boolean;
  verificationCode?: string;
  verificationExpiry?: string | Date;
  username?: string;
  firstName?: string;
  lastName?: string;
  isAdmin?: boolean;
  profileImage?: string;
  coverImage?: string;
  about?: string;
  location?: string;
  worksAt?: string;
  relationship?: string;
  occupation?: string;
  interests?: any[]; // could also be string[]
  followers?: string[];
  following?: string[];
  onboardingStep?: string | null;
  country?: string | null;
  state?: string | null;
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
  msgStatus?: SnackbarStatus;
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
  status: SnackbarStatus;
}

export interface IListResponse<T> {
  message: string;
  payload?: T[] | null;
  status: SnackbarStatus;
}

export interface InputValidation {
  status: "VALID" | "INVALID";
  message: string;
}

export interface IStep {
  name: string;
  element: React.ReactNode;
  action?: () => void;
  allowPrevious?: boolean;
}

export interface IPage {
  title: string;
  path: string;
}

export interface IDragConfig {
  axis: "X" | "Y";
  dragOrigin?: "LTR" | "RTL";
  threshold?: number;
  closeAtMiddle?: boolean;
}

export interface IDragResult {
  axis: "X" | "Y";
  dragOffset: number;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (onDragEnd?: () => void) => void;
  };
}

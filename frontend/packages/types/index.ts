"use client";

// Types
export type AuthStatus =
  | "UNKNOWN"
  | "AUTHENTICATED"
  | "UNAUTHENTICATED"
  | "PENDING"
  | "ERROR";
export type NetworkStatus = "STABLE" | "UNSTABLE" | "OFFLINE" | "UNKNOWN";
export type Direction = "left" | "right" | "up" | "down";
export type UIMode = "online" | "offline";
export type DateType = "shortened" | "complete" | "date-only";
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

export interface IGist {
  _id: string;
  authorId: string;
  content: string;
  media: string[] | null;
  likeCount: number;
  likedByMe: boolean;
  createdAt: number;
  status: "ACTIVE" | "DELETED";
}

export interface IStake {
  _id: string;
  authorId: string;
  content: string;
  media: string | null;
  createdAt: string | number;
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
  status: "valid" | "invalid";
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

export interface IMedia {
  id?: string;
  src: string;
  title?: string;
  type?: "image" | "video";
  viewMode?: "list" | "isolated";
}

export type IFeed = (IGist & { type: "gist" }) | (IStake & { type: "stake" });

export interface IDragConfig {
  axis: "x" | "y";
  dragOrigin?: "ltr" | "rtl";
  threshold?: number;
  closeAtMiddle?: boolean;
}

export interface IDragResult {
  axis: "x" | "y";
  dragOffset: number;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (onDragEnd?: () => void) => void;
  };
}

// export interface IModule {
//   [key: string]: React.ComponentType<any> | (() => any); // Allow dynamic string access
//   useCallBack: () => void;
// }

// export interface IWebsiteModule {
//   view: "about" | "pricing" | "support";
//   children?: React.ReactNode;
// }

// export interface IAuthModule {
//   view: "login" | "signup";
//   children?: React.ReactNode;
// }

// export interface ISharedComponents {}
// export interface ISharedHooks {}

"use client";

export type LoginStatus = "UNKNOWN" | "AUTHENTICATED" | "UNAUTHENTICATED";
export type ResponseStatus = "SUCCESS" | "ERROR" | "INFO" | "WARNING" | null;

export type GenericObject<T> = {
  [key: string]: T | GenericObject<T>;
};

export interface IUser {
  _id: string;
  email: string;
  password?: string; // Often excluded on frontend for security
  isEmailVerified?: boolean;
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
  followers?: string[];
  following?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Post {
  _id: string;
  authorId: string;
  content: string;
  postImage: string | null;
  likes: string[];
  createdAt: number;
}

export interface NavItem {
  title?: string;
  element?: React.ReactNode;
  url?: string;
  action?: () => void;
}

export interface NavBarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  defaultNavList: NavItem[];
  loggedInNavList: NavItem[];
}

export interface ListItemType {
  item: React.ReactNode | string;
  action?: () => void | null;
}

export interface MsgType {
  id?: number;
  title?: string | null;
  content?: string | null;
  msgStatus?: ResponseStatus;
  behavior?: "FIXED" | "TIMED";
  duration?: number;
  hasClose?: boolean;
  cta?: {
    label: string;
    action: () => void;
  };
}

export interface SnackBarMsg {
  messgages?: MsgType[];
  defaultDur: number;
}

export interface SingleResponse<T> {
  message: string;
  payload: T | null;
  status: ResponseStatus;
}

export interface ListResponse<T> {
  message: string;
  payload?: T[] | null;
  status: ResponseStatus;
}

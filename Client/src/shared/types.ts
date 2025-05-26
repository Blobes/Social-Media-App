"use client";

export type GenericObject<T> = {
  [key: string]: T | GenericObject<T>;
};

export interface IUser {
  _id: string;
  email: string;
  password?: string; // Often excluded on frontend for security
  isEmailVerified: boolean;
  username: string;
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
  id: string;
  authorId: string;
  content: string;
  postImage: string | null;
  likes: string[];
  createdOn: number;
}

export interface ListItemType {
  item: React.ReactNode | string;
  action?: () => void | null;
}

export interface Feedback {
  message: {
    timed: string | null;
    fixed: string | null;
  };
  type: "SUCCESS" | "ERROR" | "INFO" | "WARNING" | null;
  progress: {
    seconds: number;
    width: number;
  };
}

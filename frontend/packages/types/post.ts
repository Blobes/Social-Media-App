"use client";

import { IMedia } from "./misc";

export type IPostStatus = "ACTIVE" | "DELETED";
export type IPostType = "GIST" | "STAKE";

export interface IAuthor {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  profileImage?: string;
}

export interface IStake {
  _id: string;
  authorId: string;
  author: IAuthor;
  content: string;
  media: IMedia[];
  createdAt: string | number;
}

export interface IGist {
  _id: string;
  authorId: string;
  author: IAuthor;
  content: string;
  contentId: string;
  media: IMedia[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  editCount: number;
  isEdited: boolean;
  isFollowingAuthor: boolean;
  authorfollowsMe: boolean;
  status: IPostStatus;
  createdAt: string | number;
  updatedAt: string | number;
}

export type IPost =
  | (IGist & { postType: "GIST" })
  | (IStake & { postType: "STAKE" });

"use client";

import { IMediaModel } from "./model-types/media";
import { IGistModel } from "./model-types/posts";
import { IUserModel } from "./model-types/user";

export interface IMedia extends IMediaModel {
  alt?: string;
  viewMode?: "LIST" | "ISOLATED";
}

export interface IUser extends IUserModel {
  lastSeen?: string;
}

// export type IPostStatus = "ACTIVE" | "DELETED";
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

export interface IGist extends IGistModel {
  author: IAuthor;
  content: string; // Needs to be changed to caption object
  contentId: string;
  media: IMedia[];
  likedByMe: boolean;
  isEdited: boolean;
  isFollowingAuthor: boolean;
  authorfollowsMe: boolean;
}

export type IPost =
  | (IGist & { postType: "GIST" })
  | (IStake & { postType: "STAKE" });

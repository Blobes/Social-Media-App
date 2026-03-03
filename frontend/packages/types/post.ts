"use client";

export type IPostStatus = "ACTIVE" | "DELETED";
export type IPostType = "GIST" | "STAKE";
export type IMediaType = "IMAGE" | "VIDEO" | "GIF";

export interface IAuthor {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  profileImage?: string;
}

export interface IMedia {
  _id: string;
  url: string;
  type?: IMediaType;
  thumbnailUrl?: string;
  alt?: string;
  viewMode?: "LIST" | "ISOLATED";
  mimeType?: string;
  dimensions?: {
    width: number;
    height: number;
    aspectRatio: number;
  };
}

export interface IStake {
  _id: string;
  author: IAuthor;
  content: string;
  media: IMedia[];
  // media: string | null;
  createdAt: string | number;
}

export interface IGist {
  _id: string;
  author: IAuthor;
  content: string;
  contentId: string;
  media: IMedia[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  editCount: number;
  status: IPostStatus;
  createdAt: string | number;
  updatedAt: string | number;
}

export type IPost = (IGist & { type: "GIST" }) | (IStake & { type: "STAKE" });

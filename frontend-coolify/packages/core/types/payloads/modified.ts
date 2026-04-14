"use client";

import { IMediaPayload } from "./media";
import { IGistPayload, IStakePayload } from "./post";
import { IUserPayload } from "./user";

export type FetchStatus =
  | "SUCCESS"
  | "UNAUTHORIZED"
  | "ERROR"
  | "INFO"
  | "WARNING"
  | "DEACTIVATED"
  | null;

export interface ISinglePayload<T> {
  message: string;
  payload: T | null;
  status: FetchStatus;
  httpStatus?: number;
}

export interface IListPayload<T> {
  message: string;
  payload: T[] | null;
  status: FetchStatus;
  httpStatus?: number;
}

export interface IMedia extends IMediaPayload {
  viewMode?: "LIST" | "ISOLATED";
}

export interface IUser extends IUserPayload {
  lastSeen?: string;
}

export interface IGist extends IGistPayload {}

export interface IStake extends IStakePayload {}

export type IPost =
  | (IGist & { postType: "GIST" })
  | (IStake & { postType: "STAKE" });

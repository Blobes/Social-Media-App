"use client";

import { SystemStyleObject } from "@mui/system";
import { Theme } from "@mui/material/styles";
import { FetchStatus } from "./payloads/modified";
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

export type InputType =
  | "EMAIL"
  | "PHONE"
  | "PASSWORD"
  | "USERNAME"
  | "NUMBER"
  | "UNKNOWN";
export type InputStatus = "VALID" | "INVALID";

// export type GenericObject<T> = {
//   [key: string]: T | GenericObject<T>;
// };

export type GenericStyle = SystemStyleObject<Theme> & {
  [key: string]: any;
};

export interface IMenuItem {
  id?: string;
  title?: string;
  type?: "LINK" | "BUTTON" | "COMPONENT";
  element?: React.ReactNode;
  url?: string;
  action?: () => void;
}

export interface INavBar {
  setLastPage: (page: IPage) => void;
  list: IMenuItem[];
}

export interface IListItem {
  item: React.ReactNode;
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
  icon?: React.ReactNode;
}

export interface ISnackBarMsg {
  messages?: IMessage[];
  defaultDur: number;
  dir?: Direction;
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

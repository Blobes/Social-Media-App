"use client";

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

export type InputType = "EMAIL" | "PHONE" | "PASSWORD" | "USERNAME" | "NUMBER";
export type InputStatus = "VALID" | "INVALID";

export type GenericObject<T> = {
  [key: string]: T | GenericObject<T>;
};

export type GenericStyle = {
  // Each key can be a CSS property, a nested object, or a theme function
  [key: string]:
    | React.CSSProperties // Standard CSS
    | ((theme: Theme) => React.CSSProperties | object) // Theme-aware function
    | GenericStyle // Recursive nesting
    | any; // Fallback for MUI-specific keys (e.g. "&:hover")
};

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

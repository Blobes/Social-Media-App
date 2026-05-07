"use client";

import { SystemStyleObject } from "@mui/system";
import { Theme } from "@mui/material/styles";
import { FetchStatus, IUser } from "./payloads/modified";
import { Direction } from "./ui-props";

// Types
export type AuthStatus =
  | "UNKNOWN"
  | "AUTHENTICATED"
  | "NOT_ONBOARDED"
  | "UNAUTHENTICATED"
  | "DEACTIVATED"
  | "PENDING"
  | "ERROR";

export type NetworkStatus = "STABLE" | "UNSTABLE" | "OFFLINE" | "UNKNOWN";
export type UIMode = "ONLINE" | "OFFLINE";
export type DateType = "SHORTENED" | "COMPLETE" | "DATE-ONLY";

export type OtpReason =
  | "NEW_DEVICE"
  | "STALE_DEVICE"
  | "UNTRUSTED_DEVICE"
  | "UNVERIFIED_ACCOUNT"
  | "NEW_ACCOUNT";

export type OnboardingStep =
  | "ONBOARDING_INTRO"
  | "ONBOARDING_CONTINUATION"
  | "ONBOARDING_BASIC_DETAILS"
  | "ONBOARDING_DEMOGRAPHICS"
  | "ONBOARDING_PROFILE_SETUP";

export type OtpChannel = "EMAIL" | "PHONE";

export type InputType =
  | OtpChannel
  | "PASSWORD"
  | "USERNAME"
  | "NUMBER"
  | "UNKNOWN";

export type InputStatus = "VALID" | "INVALID";

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
  id?: string;
  headline?: string | null;
  tagline?: string | null;
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

export interface QueueItem<T = any> {
  newValue: T;
  prevValue?: T;
  timestamp?: number;
  retryCount?: number;
}
export type GenericQueue = Record<string, QueueItem>;

export interface TransitPayloadMap {
  LOGIN: IUser;
  REGISTRATION: { email: string; tempToken: string }; // Example
  ACCOUNT_UPDATE: { field: string; oldValue: string }; // Example
}

export type Purpose = keyof TransitPayloadMap;

export interface TransitData<P extends Purpose> {
  _id: string;
  purpose: P;
  payload: TransitPayloadMap[P];
}

export type OtpNextStep = OnboardingStep | "FEED";

export type OtpTransitData<P extends Purpose = Purpose> = TransitData<P> & {
  identifier: string;
  channel: OtpChannel;
  reason: OtpReason;
  onVerificationSuccess?: () => void;
  nextStep?: OtpNextStep;
};

export type OnboardingTransitData<P extends Purpose = Purpose> =
  TransitData<P> & {
    currentStep?: OnboardingStep;
    nextStep: OnboardingStep;
  };

export interface CachedItem<T> {
  data: T;
  lastViewed: Date | null;
}

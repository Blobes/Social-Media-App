"use client";

import { SystemStyleObject } from "@mui/system";
import { Theme } from "@mui/material/styles";
import { FetchStatus, IMedia, IUser } from "./payloads/modified";
import { Direction } from "./ui-props";
import { CSSProperties } from "react";

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

export type OtpReason =
  | "NEW_DEVICE"
  | "STALE_DEVICE"
  | "UNTRUSTED_DEVICE"
  | "UNVERIFIED_ACCOUNT"
  | "NEW_ACCOUNT";

export type StepName =
  | "INTRO"
  | "WELCOME_BACK"
  | "IDENTITY"
  | "DEMOGRAPHICS"
  | "VISUALS"
  | "PROFESSIONAL"
  | "COMPLETED"
  | "IDENTIFIER"
  | "RESTORE_ACCOUNT"
  | "PASSWORD";

export type OtpChannel = "EMAIL" | "PHONE";

export type InputType =
  | OtpChannel
  | "PASSWORD"
  | "USERNAME"
  | "NUMBER"
  | "UNKNOWN"
  | "NAME";

export type Action = "LOGIN" | "REGISTRATION" | "ACCOUNT_UPDATE";

export type InputStatus = "VALID" | "INVALID";

export type GenericStyle = SystemStyleObject<Theme> & {
  [key: string]: SystemStyleObject<Theme> | CSSProperties | any;
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

export interface ISnackBarMsgs {
  messages?: IMessage[];
  defaultDur: number;
  dir?: Direction;
}

export interface InputValidation {
  id?: string;
  status: InputStatus;
  message?: string;
  type?: InputType;
}

export interface IStep<T> {
  name: T;
  label?: string; // Human-readable label (e.g., "Personal")
  element: React.ReactNode;
  action?: () => void;
  allowPrevious?: boolean;
  revisitable?: boolean; // Controls if a completed step can be clicked
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
  LOGIN_VERIFICATION: IUser;
  REGISTRATION: { email: string; tempToken: string }; // Example
  ACCOUNT_UPDATE: { field: string; oldValue: string }; // Example
  IDENTIFIER_UPDATE: { field: string; oldValue: string };
}

export type TransitPurpose = keyof TransitPayloadMap;

export interface TransitData<P extends TransitPurpose = TransitPurpose> {
  _id: string;
  purpose: P;
  payload: TransitPayloadMap[P];
}

export type OtpNextStep = StepName | "FEED";

export type OtpTransitData<P extends TransitPurpose = TransitPurpose> =
  TransitData<P> & {
    identifier: string;
    channel: OtpChannel;
    reason: OtpReason;
    onVerificationSuccess?: () => void;
    nextStep?: OtpNextStep;
  };

export type OnboardingTransitData<P extends TransitPurpose = TransitPurpose> =
  TransitData<P> & {
    currentStep?: StepName;
    nextStep: StepName;
  };

export interface IIdbData<T> {
  data: T;
  savedAt: Date | null;
  lastViewed?: Date | null;
}

export interface GuideDetail {
  id?: string;
  detail: React.ReactNode;
}
export interface Guide {
  id?: string;
  title?: string;
  guideDetails: GuideDetail[];
  icon?: React.ReactElement;
  displayAsList?: boolean;
}

type TourStepName = "BEGIN" | "POST";
export interface TourGuide extends Omit<IStep<TourStepName>, "element"> {
  media?: IMedia;
  xPosition: number;
  yPosition: number;
  desc?: React.ReactNode;
}

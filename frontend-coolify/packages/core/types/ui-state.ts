"use client";

import { SystemStyleObject } from "@mui/system";
import { Theme } from "@mui/material/styles";
import {
  FetchStatus,
  IMedia,
  ISinglePayload,
  ITopicPayload,
  IUser,
} from "./payloads/modified";
import { Direction, IStep } from "./ui-props";
import { CSSProperties } from "react";
import { Dimensions, MediaType, StorageProvider } from "./payloads/media";

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
  | "NEW_ACCOUNT"
  | "PASSWORD_RESET";

export type PostStepName = "CONTENT" | "SETTINGS" | "MEDIA_PREVIEW";
export type PasswordResetStepName = "CREDENTIAL" | "NEW_PASSWORD";
export type AuthStepName =
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

export type StepName =
  | "FEED"
  | AuthStepName
  | PostStepName
  | PasswordResetStepName;

export type OtpVerificationMethod = "EMAIL_OR_SMS" | "AUTHENTICATOR_DEVICE";

export type OtpChannel = "EMAIL" | "PHONE" | "AUTHENTICATOR";

export type InputType =
  | OtpChannel
  | "PASSWORD"
  | "USERNAME"
  | "NUMBER"
  | "UNKNOWN"
  | "NAME";

export type Action = "LOGIN" | "SIGNUP" | "ACCOUNT_UPDATE";

export type InputStatus = "VALID" | "INVALID";

export type InputFieldType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "phone-formatted"
  | "password";

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

export interface IInlineMsg {
  msg: React.ReactNode | null;
}

export interface IMessage {
  id?: string;
  headline?: string;
  tagline?: string;
  customContent?: React.ReactNode;
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

export interface IPage {
  title: string | (() => string);
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
  ACCOUNT_VERIFICATION: IUser;
  ACCOUNT_UPDATE: { field: string; oldValue: string }; // Example
  IDENTIFIER_UPDATE: { field: string; oldValue: string };
  PASSWORD_RESET: {
    currentStep?: PasswordResetStepName;
    nextStep?: PasswordResetStepName;
  };
}

export type TransitPurpose = keyof TransitPayloadMap;

export interface TransitData<P extends TransitPurpose = TransitPurpose> {
  _id: string;
  purpose: P;
  payload?: TransitPayloadMap[P];
}

export type OtpTransitData<P extends TransitPurpose = TransitPurpose> =
  TransitData<P> & {
    identifier: string;
    channel: OtpChannel;
    reason: OtpReason;
    onVerificationSuccess?: () => void;
    nextStep?: StepName;
  };

// export type GeneralTransitData<P extends TransitPurpose = TransitPurpose> =
//   TransitData<P> & {
//     currentStep?: StepName;
//     nextStep?: StepName;
//   };

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

export type MediaProcessingStatus =
  | "IDLE"
  | "LOADING_ENGINE"
  | "OPTIMIZING"
  | "SUCCESS"
  | "ERROR"
  | "UPLOADING"
  | "FAILED";

export interface MediaProcessingProgress {
  i18nKey?: string;
  fileName?: string;
  status: MediaProcessingStatus;
  progress: number;
  error?: string;
}

export interface TrackedFile extends File {
  trackingId: string;
}

export interface MediaUploadPayload {
  url: string;
  fileKey: string;
  type: MediaType;
  thumbnailUrl: string | null;
  mimeType: string;
  size: number;
  dimensions: Dimensions;
  blurHash: string;
  storageProvider: StorageProvider;
}

export type ITopic = IMenuItem & ITopicPayload;

export interface NavigateOptions {
  type?: "push" | "replace";
  savePage?: boolean;
  loadPage?: boolean;
  event?: React.MouseEvent;
}

export interface DynamicTranslateReq {
  textId: string;
  textToTranslate: string;
  sourceLang: string;
  targetLang: string;
}
export interface DynamicTranslateRes {
  translatedText: string;
}
export interface DynamicTranslateFns {
  translateServiceFn: (
    data: DynamicTranslateReq,
  ) => Promise<ISinglePayload<DynamicTranslateRes | null>>;
  resolveTranslation?: (
    response: ISinglePayload<DynamicTranslateRes | null>,
  ) => string | undefined;
}
export interface DynamicTranslateArgs {
  textData: DynamicTranslateReq;
  parentKey: string;
  transCb: DynamicTranslateFns;
}

export interface ITfaData {
  secret: string | null;
  isEnabled: boolean;
  backupCodes: string[];
  tempSecret?: string | null;
  tempBackupCodes?: string[];
}

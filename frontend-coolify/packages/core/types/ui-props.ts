"use client";

import React from "react";
import { GenericStyle, IMenuItem } from "./ui-state";
import { IMedia } from "./media";

export type Direction = "left" | "right" | "up" | "down";
export type TransitionType = "fade" | "grow" | "slide" | "zoom" | "collapse";

export enum ListType {
  COUNTRY = "COUNTRY",
  TOPICS = "TOPICS",
  NAVIGATION = "NAVIGATION",
  DEFAULT = "ITEM",
}

export enum KeyType {
  POST = "POST",
  USER = "USER",
}

export interface ITranslation {
  readonly tKey?: string;
  readonly tValue?: string;
  readonly interpolations?: Record<string, any>;
  inlineComponents?: React.ReactElement[] | Record<string, React.ReactElement>;
}

export interface TransData {
  headline?: ITranslation;
  textDesc?: ITranslation;
  primaryBtn?: ITranslation;
  secondaryBtn?: ITranslation;
}

export interface ElementPosition {
  x: number;
  y: number;
}

// Drag Event
export interface IDragConfig {
  axis?: "X" | "Y";
  dragOrigin?: "LTR" | "RTL";
  threshold?: number;
  closeAtMiddle?: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  onPositionChange?: (position: ElementPosition) => void;
}
export interface IDragResult {
  axis: "X" | "Y";
  dragOffset: number;
  resolveDragConfig: (dir?: Direction) => IDragConfig;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (onDragEnd?: () => void) => void;
    onElementDragStart: (
      e: React.MouseEvent<HTMLDivElement>,
      itemId: string,
      onFocus?: (id: string) => void,
    ) => void;
  };
}

export interface MenuRef {
  openMenu: (anchor: HTMLElement) => void;
  closeMenu: () => void;
}

/**
 * Imperative controls for overlay instances.
 */
export interface OverlayRef {
  openOverlay: () => void;
  closeOverlay: () => void;
}
/**
 * Common responsive styling configuration across overlay variants.
 */
export interface OverlayStyleProps {
  base?: {
    overlay?: GenericStyle;
    content?: GenericStyle;
  };
  smallScreen?: {
    overlay?: GenericStyle;
    content?: GenericStyle;
  };
  mediumScreen?: {
    overlay?: GenericStyle;
    content?: GenericStyle;
  };
  header?: GenericStyle;
}

/**
 * Shared layout, accessibility, and event properties for overlay components.
 */
export interface BaseOverlayProps {
  content: React.ReactNode;
  showHeader?: boolean;
  header?: React.ReactNode;
  onClose?: () => void;
  style?: OverlayStyleProps;
}

/**
 * Properties for centered modal views.
 */
export interface ModalProps extends BaseOverlayProps {
  canBeClosed?: boolean;
  transition?: {
    type: TransitionType;
    direction?: Direction;
  };
}
/**
 * Properties for slide-out drawer views.
 */
export interface DrawerProps extends BaseOverlayProps {
  clickToClose?: boolean;
  transDirection?: {
    base?: Direction;
    mobile?: Direction;
  };
  dragConfig?: IDragConfig;
  blurOverlayBG?: boolean;
  source?: string;
}

export interface ICountryItem extends IMenuItem {
  name?: string;
  code?: string;
  iso?: string;
  flag?: string;
  titleFlag?: string;
  titleCode?: string;
  isoCode?: string;
  codeFlag?: string;
  fullInfo?: string;
}

export interface IStep<T> {
  name: T;
  label?: string; // Human-readable label (e.g., "Personal")
  element: React.ReactNode;
  action?: () => void;
  allowPrevious?: boolean;
  revisitable?: boolean; // Controls if a completed step can be clicked
}

export interface NavigationProps {
  onNext?: () => void;
  onPrev?: () => void;
  jumpTo?: () => void;
}

export interface StepperStyle {
  container?: GenericStyle;
  headline?: GenericStyle;
  tagline?: GenericStyle;
}

export interface StepperProps<T> extends NavigationProps {
  modalRef?: React.RefObject<OverlayRef>;
  redirectTo?: string;
  style?: StepperStyle;
  setStep?: (step: T) => void;
  step?: T;
}

export interface IBGFadeSlideData {
  name?: string;
  headline: string;
  tagline: string;
  media: IMedia;
}

export type DisplayFeedbackUIType =
  | "ALREADY_LOGGED_IN"
  | "UNAUTHORIZED"
  | "NETWORK_GLITCH"
  | "MAINTENANCE"
  | "BANNED"
  | "NEEDS_LOGIN"
  | "NEEDS_ONBOARDING"
  | "NEEDS_OTP_VERIFICATION"
  | "NEEDS_RESTORE"
  | "PASSWORD_RESET_SUCCESS"
  | "UNKNOWN";

export interface FeedbackCTA {
  type?: "BUTTON" | "ICON";
  variant?: "contained" | "outlined";
  label?: React.ReactNode;
  toolTip?: string;
  action?: () => void | Promise<void>;
  href?: string;
}
export interface FeedbackStyle {
  container?: GenericStyle;
  headline?: GenericStyle;
  tagline?: GenericStyle;
  icon?: GenericStyle;
  primaryCta?: GenericStyle;
  secondaryCta?: GenericStyle;
}
export interface FeedbackProps {
  headline?: React.ReactNode;
  tagline?: React.ReactNode;
  icon?: React.ReactNode;
  style?: FeedbackStyle;
  primaryCta?: FeedbackCTA;
  secondaryCta?: FeedbackCTA;
}

"use client";

import React from "react";
import { IMedia } from "./payloads/modified";
import { GenericStyle, IMenuItem } from "./ui-state";

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

// Transition
export interface IDragConfig {
  axis: "X" | "Y";
  dragOrigin?: "LTR" | "RTL";
  threshold?: number;
  closeAtMiddle?: boolean;
}
export interface IDragResult {
  axis: "X" | "Y";
  dragOffset: number;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (onDragEnd?: () => void) => void;
  };
}
export interface MenuRef {
  openMenu: (anchor: HTMLElement) => void;
  closeMenu: () => void;
}

// Modal
export interface ModalRef {
  openModal: () => void;
  closeModal: () => void;
}
export interface ModalProps {
  content: React.ReactNode;
  showHeader?: boolean;
  header?: React.ReactNode;
  canBeClosed?: boolean;
  onClose?: () => void;
  transition?: { type: TransitionType; direction?: Direction };
  style?: {
    base?: { overlay?: GenericStyle; content?: GenericStyle };
    smallScreen?: {
      overlay?: GenericStyle;
      content?: GenericStyle;
    };
    header?: GenericStyle;
  };
}

// Drawer
export interface DrawerRef {
  openDrawer: () => void;
  closeDrawer: () => void;
}
export interface DrawerHooks {
  closeDrawer?: () => any;
  useDragClose?: any;
}
export interface DrawerProps {
  content: React.ReactNode;
  showHeader?: boolean;
  header?: React.ReactNode;
  clickToClose?: boolean;
  onClose?: () => void;
  transDirection?: {
    base?: Direction;
    mobile?: Direction;
  };
  useDragConfig?: () => IDragResult;
  blurOverlayBG?: boolean;
  source?: string;
  style?: {
    base?: { overlay?: GenericStyle; content?: GenericStyle };
    smallScreen?: {
      overlay?: GenericStyle;
      content?: GenericStyle;
    };
    mediumScreen?: {
      overlay?: GenericStyle;
      content?: GenericStyle;
    };
    header?: GenericStyle;
  };
}

// Media
export interface UseMedia {
  useMisc: () => { isDesktop: boolean };
}
export interface MediaStyle {
  container?: { base?: GenericStyle; smallScreen?: GenericStyle };
  content?: GenericStyle;
}
export interface MediaProps extends IMedia {
  style?: MediaStyle;
  onSingleTap?: (media?: IMedia) => void;
  onDoubleTap?: (media?: IMedia) => void;
  useMedia?: UseMedia;
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

export interface AnalyzedImage {
  height: number;
  width: number;
  isPortrait: boolean;
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
  modalRef?: React.RefObject<DrawerRef>;
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

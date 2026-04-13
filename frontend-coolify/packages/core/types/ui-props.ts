"use client";

import { IMedia } from "./payloads/modified";
import { GenericStyle, IMenuItem } from "./ui-state";

export type Direction = "left" | "right" | "up" | "down";
export type TransitionType = "fade" | "grow" | "slide" | "zoom" | "collapse";

export enum ListType {
  COUNTRY = "COUNTRY",
  NAVIGATION = "NAVIGATION",
  DEFAULT = "ITEM",
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
  useImageColors: (src: string) => { isPortrait: boolean };
  useMisc: () => { isDesktop: boolean };
}
export interface MediaStyle {
  container?: { base?: any; smallScreen?: any };
  content?: any;
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

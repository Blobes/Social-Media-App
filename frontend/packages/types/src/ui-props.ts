import { GenericObject } from "./data";

export type Direction = "left" | "right" | "up" | "down";

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

export type TransitionType = "fade" | "grow" | "slide" | "zoom" | "collapse";

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
    base?: { overlay?: GenericObject<string>; content?: GenericObject<string> };
    smallScreen?: {
      overlay?: GenericObject<string>;
      content?: GenericObject<string>;
    };
    header?: GenericObject<string>;
  };
}

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
    base?: { overlay?: GenericObject<string>; content?: GenericObject<string> };
    smallScreen?: {
      overlay?: GenericObject<string>;
      content?: GenericObject<string>;
    };
    mediumScreen?: {
      overlay?: GenericObject<string>;
      content?: GenericObject<string>;
    };
    header?: GenericObject<string>;
  };
}

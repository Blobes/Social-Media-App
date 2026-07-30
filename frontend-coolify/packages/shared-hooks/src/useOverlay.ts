"use client";

import {
  useState,
  useRef,
  useImperativeHandle,
  useCallback,
  useMemo,
  Ref,
  useEffect,
} from "react";
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Direction, IDragConfig, OverlayRef } from "@repo/core";
import { useDrag } from "@repo/shared-hooks";

export type OverlayType = "MODAL" | "DRAWER";

export interface UnifiedOverlayOptions {
  type: OverlayType;
  ref: Ref<OverlayRef>;
  canClose?: boolean;
  onClose?: () => void;
  transDirection?: {
    base?: Direction;
    mobile?: Direction;
  };
  dragConfig?: IDragConfig;
}

/**
 * Encapsulates view lifecycle, swipe gestures, and open states across Modal and Drawer interfaces.
 */
export const useUnifiedOverlay = ({
  type,
  ref,
  canClose = true,
  onClose,
  transDirection,
  dragConfig,
}: UnifiedOverlayOptions) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [shouldRemove, setShouldRemove] = useState(true);

  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const baseDir = transDirection?.base || "left";
  const mobileDir = transDirection?.mobile ?? baseDir;
  const activeTransDir = isDesktop ? baseDir : mobileDir;

  const { dragOffset, handlers, resolveDragConfig } = useDrag(dragConfig);
  const dragInfo = useMemo(
    () => resolveDragConfig(activeTransDir),
    [resolveDragConfig, activeTransDir],
  );

  /**
   * Triggers dismissal by reversing the entrance transition state before invoking callbacks.
   */
  const triggerClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      openOverlay: () => {
        setShouldRemove(false);
        requestAnimationFrame(() => {
          setIsOpen(true);
        });
      },
      closeOverlay: () => {
        triggerClose();
      },
    }),
    [triggerClose],
  );

  useEffect(() => {
    setShouldRemove(false);
    requestAnimationFrame(() => {
      setIsOpen(true);
    });
  }, []);

  /**
   * Evaluates backdrop click event sources to issue dismissal state updates.
   */
  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      if (!canClose) return;

      const target = e.target as Node;
      const isCloseButtonClick =
        closeRef.current && closeRef.current.contains(target);

      const isBackdropClick =
        containerRef.current &&
        (e.target === containerRef.current ||
          !containerRef.current.children[0]?.contains(target));

      if (isBackdropClick || isCloseButtonClick) {
        triggerClose();
      }
    },
    [canClose, triggerClose],
  );

  /**
   * Handles transition exit completion events to remove content from layout DOM flow.
   */
  const handleExited = useCallback(() => {
    setShouldRemove(true);
    onClose?.();
  }, [onClose]);

  /**
   * Binds mobile touch gesture listeners to evaluate swipe dismissal thresholds.
   */
  const getTouchHandlers = useCallback(() => {
    if (type !== "DRAWER" || !isMobile || !handlers) return {};

    return {
      onTouchStart: handlers.onTouchStart,
      onTouchMove: handlers.onTouchMove,
      onTouchEnd: () =>
        handlers.onTouchEnd(() => {
          triggerClose();
        }),
    };
  }, [type, isMobile, handlers, triggerClose]);

  return {
    isOpen,
    shouldRemove,
    containerRef,
    closeRef,
    isDesktop,
    isMobile,
    transDir: activeTransDir,
    dragOffset,
    dragInfo,
    handleClose,
    handleExited,
    touchHandlers: getTouchHandlers(),
    theme,
  };
};

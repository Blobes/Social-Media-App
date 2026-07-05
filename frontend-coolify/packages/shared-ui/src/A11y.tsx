"use client";

import React, { useRef } from "react";
import {
  useMove,
  VisuallyHidden,
  useOverlay,
  FocusScope,
  usePreventScroll,
} from "react-aria";
import { Box, SxProps } from "@mui/material";
import { Theme } from "@mui/material/styles";

export type A11yUseCase =
  | "text-live" // WCAG 4.1.3: Status Messages
  | "dialog" // WCAG 2.4.3: Focus Order / 2.1.1 Keyboard
  | "carousel-track" // WCAG 2.1.1: Keyboard swipe handlers
  | "interactive" // WCAG 2.4.7: Focus Visible
  | "hidden-label"; // WCAG 1.3.1: Screen reader contextual explanations

interface A11yProps {
  useCase: A11yUseCase;
  children: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  label?: string;
  onSwipeNext?: () => void;
  onSwipePrev?: () => void;
  sx?: SxProps<Theme>;
}

/**
 * Centrally attaches WCAG semantic attributes, roles, and focus traps to existing components without adding layout styles.
 */
export const A11y = ({
  useCase,
  children,
  isOpen = false,
  onClose,
  label,
  onSwipeNext,
  onSwipePrev,
  sx,
}: A11yProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus trap configurations for modals (WCAG 2.4.3)
  const { overlayProps } = useOverlay(
    { isOpen, onClose, isDismissable: true },
    useCase === "dialog" ? containerRef : { current: null },
  );
  usePreventScroll({ isDisabled: useCase !== "dialog" || !isOpen });

  // Custom key interaction abstractions for carousels (WCAG 2.1.1)
  const { moveProps } = useMove({
    onMove: (e) => {
      if (useCase !== "carousel-track") return;
      if (e.pointerType === "keyboard") {
        if (e.deltaX > 0 && onSwipeNext) onSwipeNext();
        if (e.deltaX < 0 && onSwipePrev) onSwipePrev();
      }
    },
  });

  switch (useCase) {
    case "dialog":
      if (!isOpen) return null;
      return (
        /* Locks tab key indexing inside your existing modal window structure */
        <FocusScope contain restoreFocus autoFocus>
          <Box
            {...overlayProps}
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            sx={{ display: "flex", ...sx }} // Keeps layout transparent to protect child styles
          >
            {children}
          </Box>
        </FocusScope>
      );

    case "text-live":
      return (
        <Box
          ref={containerRef}
          aria-live="polite"
          aria-atomic="true"
          sx={{ display: "contents", ...sx }}>
          {children}
        </Box>
      );

    case "carousel-track":
      return (
        <Box
          {...moveProps}
          ref={containerRef}
          role="region"
          aria-roledescription="carousel"
          aria-label={label ?? "Slider track"}
          tabIndex={0}
          sx={{ display: "contents", ...sx }}>
          {children}
        </Box>
      );

    case "interactive":
      return (
        <Box
          component="span"
          ref={containerRef}
          sx={{
            display: "contents",
            "& *:focus-visible": {
              outline: "2px solid var(--mui-palette-primary-main) !important",
              outlineOffset: "3px !important",
              boxShadow: "0 0 0 4px var(--mui-fixedColors-pTrans) !important",
            },
            ...sx,
          }}>
          {children}
        </Box>
      );

    case "hidden-label":
      return <VisuallyHidden>{children}</VisuallyHidden>;

    default:
      return <>{children}</>;
  }
};

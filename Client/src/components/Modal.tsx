"use client";

import React, {
  useImperativeHandle,
  forwardRef,
  useRef,
  useState,
  MouseEvent,
} from "react";
import { IconButton, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Close } from "@mui/icons-material";
import { fadeIn, fadeOut, moveIn, moveOut } from "../helpers/animations";
import { useStyles } from "@/helpers/styles";
import { GenericObject } from "@/types";

export interface ModalRef {
  openModal: () => void;
  closeModal: () => void;
}

export interface ModalProps {
  header?: React.ReactNode;
  content: React.ReactNode;
  shouldClose?: boolean;
  showHeader?: boolean;
  onClose?: () => void;
  entryDir?: "LEFT" | "RIGHT" | "CENTER";
  style?: {
    overlay?: GenericObject<string>;
    content?: {
      width?: { xs?: string; sm?: string; md?: string };
      maxWidth?: { xs?: string; sm?: string; md?: string };
      otherStyles?: GenericObject<string>;
    };
  };
}

export const Modal = forwardRef<ModalRef, ModalProps>(
  (
    {
      header,
      content,
      entryDir = "RIGHT",
      shouldClose = true,
      showHeader = true,
      onClose,
      style,
    },
    ref
  ) => {
    const [isOpen, setOpen] = useState(false);
    const [shouldRemove, setShouldRemove] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);
    const { scrollBarStyle } = useStyles();
    const theme = useTheme();
    const {
      overlay,
      content: {
        width = { xs: "80%", sm: "80%", md: "40%" },
        maxWidth = { xs: "100%", sm: "350px", md: "400px" },
        otherStyles,
      } = {},
    } = style || {};

    useImperativeHandle(ref, () => ({
      openModal: () => {
        setShouldRemove(false);
        setTimeout(() => {
          setOpen(true), 50;
        });
      },
      closeModal: () => {
        setTimeout(() => {
          setOpen(false);
          setShouldRemove(true), 200;
        });
      },
    }));

    const handleClose = (e: MouseEvent<HTMLDivElement | HTMLButtonElement>) => {
      if (
        (containerRef.current && e.target === containerRef.current) ||
        (closeRef.current && closeRef.current.contains(e.target as HTMLElement))
      ) {
        setOpen(false);
        setTimeout(() => setShouldRemove(true), 200);
        if (onClose) onClose();
      }
    };

    return (
      <Stack //Overlay container
        ref={containerRef}
        {...(shouldClose ? { onClick: handleClose } : {})}
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 999,
          visibility: !shouldRemove ? "visible" : "hidden",
          opacity: isOpen ? 1 : 0,
          animation: `${isOpen ? fadeIn : fadeOut} 0.2s linear forwards`,
          alignItems:
            entryDir === "LEFT"
              ? "flex-start"
              : entryDir === "RIGHT"
              ? "flex-end"
              : "center",
          justifyContent: "center",
          marginLeft: "0!important",
          padding: {
            xs: theme.boxSpacing(4, 2),
            sm: theme.boxSpacing(12, 12),
          },
          backgroundColor: theme.palette.gray.trans.overlay,
          ...(isOpen && overlay),
          backdropFilter: "blur(8px)",
        }}>
        {/* Drawer Content Container */}
        <Stack
          sx={{
            maxHeight: "100%",
            width: width.xs,
            maxWidth: maxWidth.xs,
            padding: theme.boxSpacing(10, 10),
            [theme.breakpoints.up("sm")]: {
              width: width.sm,
              maxWidth: maxWidth.sm,
            },
            [theme.breakpoints.up("md")]: {
              width: width.md,
              maxWidth: maxWidth.md,
              padding: theme.boxSpacing(16, 16),
            },
            gap: theme.gap(0),
            backgroundColor: theme.palette.gray[0],
            borderRadius: theme.radius[3],
            border: `1px solid ${theme.palette.gray.trans[1]}`,
            overflow: "auto",
            animation: isOpen
              ? `${moveIn(entryDir, "-0px", "4px")} 0.2s linear forwards`
              : `${moveOut(entryDir, "4px", "-10px")} 0.2s linear forwards`,
            ...(scrollBarStyle() as any),
            ...otherStyles,
          }}>
          {
            /* Modal Header */
            showHeader && (
              <Stack
                direction={"row"}
                sx={{
                  position: "sticky",
                  top: 0,
                  right: 0,
                  width: "100%",
                  backgroundColor: theme.palette.gray[0],
                  padding: theme.boxSpacing(2),
                  justifyContent: "flex-end",
                }}>
                {header}
                {shouldClose && (
                  <IconButton
                    aria-label="Drawer closer"
                    aria-controls="close-drawer"
                    aria-haspopup="true"
                    ref={closeRef}
                    onClick={handleClose}>
                    <Close sx={{ width: "20px", height: "20px" }} />
                  </IconButton>
                )}
              </Stack>
            )
          }
          {content}
        </Stack>
      </Stack>
    );
  }
);
Modal.displayName = "Drawer";

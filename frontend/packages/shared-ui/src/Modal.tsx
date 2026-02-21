"use client";

import { useImperativeHandle, forwardRef, useRef, useState, } from "react";
import { IconButton, Stack, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Direction, GenericObject } from "@repo/types";
import { Transition, TransitionType } from "./Transition";
import { scrollBarStyle, zIndexes } from "@repo/helpers";
import { X } from "lucide-react";

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
  transition?: { type: TransitionType, direction?: Direction },
  style?: {
    base?: { overlay?: GenericObject<string>, content?: GenericObject<string> };
    smallScreen?: { overlay?: GenericObject<string>, content?: GenericObject<string> };
    header?: GenericObject<string>;
  };
}

export const Modal = forwardRef<ModalRef, ModalProps>(
  (
    { header, content, transition, canBeClosed = true,
      showHeader = true, onClose, style,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);

    const theme = useTheme();
    const [isOpen, setOpen] = useState(false);
    const [shouldRemove, setShouldRemove] = useState(true);
    const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

    // Transition properties
    const trans = {
      type: transition?.type || "zoom",
      direction: transition?.direction || "left"
    }
    const transType = trans.type;
    const transDir = trans.direction;


    useImperativeHandle(ref, () => ({
      openModal: () => {
        setShouldRemove(false);
        setOpen(true);
      },
      closeModal: () => {
        setOpen(false);
      },
    }));

    const handleClose = (e: React.MouseEvent) => {
      if (
        (containerRef.current && e.target === containerRef.current) ||
        (closeRef.current && closeRef.current.contains(e.target as HTMLElement))
      ) {
        setOpen(false);
        if (onClose) onClose();
      }
    };

    return (
      <Stack //Overlay container
        ref={containerRef}
        {...(canBeClosed ? { onClick: handleClose } : {})}
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: zIndexes.maximum,
          visibility: !shouldRemove ? "visible" : "hidden",
          transition: "opacity 0.3s ease-in-out, visibility 0.3s",
          opacity: isOpen ? 1 : 0,
          backgroundColor: theme.palette.gray.trans.overlay(0.6),
          backdropFilter: `blur(12px)`,
          marginLeft: "0!important",
          padding: theme.boxSpacing(12),
          // Alignment
          alignItems: transType === "slide"
            ? (transDir === "right" ? "flex-start"
              : transDir === "left" ? "flex-end" : "center")
            : "center",
          justifyContent: transType === "slide"
            ? (transDir === "down" ? "flex-start"
              : transDir === "up" ? "flex-end" : "center")
            : "center",
          ...style?.base?.overlay,

          // Small screen styling
          [theme.breakpoints.down("md")]: {
            padding: theme.boxSpacing(4, 2),
            ...style?.smallScreen?.overlay
          }
        }}>

        {/* Drawer Content Container */}
        <Transition show={isOpen}
          timeout={200} {...trans} onExited={() => setShouldRemove(true)}>
          <Stack
            sx={{
              maxHeight: "100%",
              gap: theme.gap(0),
              backgroundColor: theme.palette.gray[0],
              borderRadius: theme.radius[3],
              overflow: "hidden",
              width: style?.base?.content?.width ?? "40%",
              maxWidth: style?.base?.content?.maxWidth ?? "400px",
              touchAction: "none",
              ...style?.base?.content,

              // Medium screen
              [theme.breakpoints.down("md")]: {
                width: "60%",
                maxWidth: "350px"
              },
              // Small screen
              [theme.breakpoints.down("sm")]: {
                width: style?.smallScreen?.content?.width ?? "89%",
                maxWidth: style?.smallScreen?.content?.maxWidth ?? "100%",
                ...style?.smallScreen?.content
              },
            }}
          >
            {
              /* Modal with Header*/
              showHeader && (
                <Stack
                  sx={{
                    position: "sticky",
                    alignItems: "center",
                    gap: theme.gap(0),
                    touchAction: 'none',
                  }}>
                  {(header || canBeClosed) && (
                    <Stack
                      direction={"row"}
                      sx={{
                        width: "100%",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: theme.gap(2),
                        padding: theme.boxSpacing(2),
                        ...style?.header,
                        borderBottom: `1px solid ${theme.palette.gray.trans[1]}`
                      }}>
                      {header && header}
                      {canBeClosed && (
                        <IconButton
                          aria-label="Drawer closer"
                          aria-controls="close-drawer"
                          aria-haspopup="true"
                          ref={closeRef}
                          onClick={handleClose}>
                          <X size={22} />
                        </IconButton>
                      )}
                    </Stack>
                  )}
                </Stack>
              )
            }

            {/* Modal Body */}
            <Stack
              sx={{
                height: "100%",
                overflowY: "auto",
                padding: theme.boxSpacing(10),
                [theme.breakpoints.up("md")]: {
                  padding: theme.boxSpacing(14),
                },
                gap: theme.gap(8),
                ...(scrollBarStyle(isDesktop, theme) as any),
              }}>
              {content}
            </Stack>
          </Stack>

        </Transition >
      </Stack >
    );
  }
);
Modal.displayName = "Drawer";

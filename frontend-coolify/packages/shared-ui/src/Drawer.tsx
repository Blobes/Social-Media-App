"use client";

import React, {
  useImperativeHandle,
  forwardRef,
  useRef,
  useState,
} from "react";
import { Box, IconButton, Stack, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { X } from "lucide-react";
import { DrawerProps, DrawerRef } from "@repo/types";
import { Transition } from "./Transition";
import { applyBGEffects, scrollBarStyle } from "@repo/helpers";

export const Drawer = forwardRef<DrawerRef, DrawerProps>(
  (
    {
      showHeader = true,
      header,
      content,
      transDirection,
      clickToClose = true,
      onClose,
      style,
      useDragConfig,
      blurOverlayBG,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);

    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const [isOpen, setOpen] = useState(false);
    const [shouldRemove, setShouldRemove] = useState(true);

    // Transition properties
    const baseDir = transDirection?.base || "left";
    const mobileDir = transDirection?.mobile ?? baseDir;
    const transDir = isDesktop ? baseDir : mobileDir;

    const dragConfig = useDragConfig ? useDragConfig() : null;
    const dragOffset = dragConfig?.dragOffset ?? 0;
    const axis = dragConfig?.axis;
    const handlers = dragConfig?.handlers;

    useImperativeHandle(ref, () => ({
      openDrawer: () => {
        setShouldRemove(false);
        setOpen(true);
      },
      closeDrawer: () => {
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
        {...(clickToClose ? { onClick: handleClose } : {})}
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 1000,
          visibility: !shouldRemove ? "visible" : "hidden",
          transition:
            "opacity 0.3s ease-in-out, visibility 0.3s, background-color 0.3s",
          opacity: isOpen ? 1 : 0,
          marginLeft: "0!important",
          padding: theme.boxSpacing(12),
          ...applyBGEffects(theme).opaque(isOpen, dragOffset),
          ...(blurOverlayBG && applyBGEffects(theme).blur(isOpen, dragOffset)),

          // Alignment
          alignItems:
            transDir === "right"
              ? "flex-start"
              : baseDir === "left"
                ? "flex-end"
                : "center",

          justifyContent:
            baseDir === "down"
              ? "flex-start"
              : baseDir === "up"
                ? "flex-end"
                : "center",
          ...style?.base?.overlay,

          // Mobile styling
          [theme.breakpoints.down("md")]: {
            padding: theme.boxSpacing(4, 2),
            ...style?.smallScreen?.overlay,
          },
        }}>
        {/* Drawer Content Container */}
        <Transition
          show={isOpen}
          timeout={200}
          type="slide"
          direction={transDir}
          onExited={() => setShouldRemove(true)}>
          <Stack
            // Drag event on X axis
            {...(isMobile &&
              handlers && {
                onTouchStart: handlers.onTouchStart,
                onTouchMove: handlers.onTouchMove,
                onTouchEnd: () => handlers.onTouchEnd(() => setOpen(false)),
              })}
            sx={{
              maxHeight: "100%",
              gap: theme.gap(0),
              backgroundColor: theme.palette.gray[0],
              borderRadius: theme.radius[3],
              overflow: "hidden",
              width: style?.base?.content?.width ?? "40%",
              maxWidth: style?.base?.content?.maxWidth ?? "400px",
              touchAction: "none",

              // Drag styling
              ...(dragOffset !== 0 && {
                transform:
                  axis === "X"
                    ? `translateX(${dragOffset}px) !important`
                    : `translateY(${dragOffset}px) !important`,
                transition: "none !important",
              }),
              ...(dragOffset === 0 && {
                transition: theme.transitions.create("transform", {
                  easing: "cubic-bezier(0, 0, 0.2, 1)",
                  duration: 0.3,
                }),
              }),

              ...style?.base?.content,

              // Medium screen
              [theme.breakpoints.down("md")]: {
                width: style?.mediumScreen?.content?.width ?? "80%",
                maxWidth: style?.mediumScreen?.content?.maxWidth ?? "350px",
                ...style?.mediumScreen?.content,
              },
              // Small screen
              [theme.breakpoints.down("sm")]: {
                width: style?.smallScreen?.content?.width ?? "89%",
                maxWidth: style?.smallScreen?.content?.maxWidth ?? "100%",
                ...style?.smallScreen?.content,
              },
            }}>
            {
              /* Drawer with Header*/
              showHeader && (
                <Stack
                  sx={{
                    position: "sticky",
                    alignItems: "center",
                    gap: theme.gap(0),
                  }}>
                  {/* Drag Handle UI */}
                  {dragConfig && isMobile && axis === "Y" && (
                    <Box
                      sx={{
                        width: "50px",
                        height: "6px",
                        borderRadius: theme.radius.full,
                        marginTop: theme.boxSpacing(8),
                        backgroundColor: theme.palette.gray.trans[2],
                      }}
                    />
                  )}
                  {(header || clickToClose) && (
                    <Stack
                      direction={"row"}
                      sx={{
                        width: "100%",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: theme.gap(2),
                        padding: theme.boxSpacing(2),
                        ...style?.header,
                        borderBottom: `1px solid ${theme.palette.gray.trans[1]}`,
                      }}>
                      {header && header}
                      {clickToClose && (
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
            {/* Drawer Body */}
            <Stack
              sx={{
                height: "100%",
                overflowY: "auto",
                padding: theme.boxSpacing(10),
                [theme.breakpoints.up("md")]: {
                  padding: theme.boxSpacing(14),
                },
                gap: theme.gap(8),
                ...(scrollBarStyle(theme) as any),
              }}>
              {content}
            </Stack>
          </Stack>
        </Transition>
      </Stack>
    );
  },
);
Drawer.displayName = "Drawer";

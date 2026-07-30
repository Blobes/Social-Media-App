"use client";

import React, { forwardRef } from "react";
import { Box, IconButton, Stack } from "@mui/material";
import { X } from "lucide-react";
import { DrawerProps, OverlayRef } from "@repo/core";
import { Transition } from "./Transition";
import { applyBGEffects, scrollBarStyle } from "@repo/helpers";
import { useUnifiedOverlay } from "@repo/shared-hooks";
import { A11y } from "./A11y";

/**
 * Renders slide-out drawer container with configurable swipe-to-close touch bindings.
 */
export const Drawer = forwardRef<OverlayRef, DrawerProps>(
  (
    {
      showHeader = true,
      header,
      content,
      transDirection,
      clickToClose = true,
      onClose,
      blurOverlayBG,
      dragConfig,
      style,
    },
    ref,
  ) => {
    const {
      isOpen,
      shouldRemove,
      containerRef,
      closeRef,
      isMobile,
      transDir,
      dragOffset,
      dragInfo,
      handleClose,
      handleExited,
      touchHandlers,
      theme,
    } = useUnifiedOverlay({
      type: "DRAWER",
      ref,
      canClose: clickToClose,
      onClose,
      transDirection,
      dragConfig,
    });

    const baseDir = transDirection?.base || "left";

    return (
      <Stack
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

          [theme.breakpoints.down("md")]: {
            padding: theme.boxSpacing(4, 2),
            ...style?.smallScreen?.overlay,
          },
        }}>
        <Transition
          show={isOpen}
          timeout={250}
          type="slide"
          direction={transDir}
          onExited={handleExited}>
          <A11y
            {...touchHandlers}
            useCase="dialog"
            isOpen={isOpen}
            onClose={() => {
              handleClose({} as React.MouseEvent);
            }}
            label={
              typeof header === "string" ? header : "Drawer Dialog View Window"
            }
            sx={{
              flexDirection: "column",
              maxHeight: "100%",
              gap: theme.gap(0),
              backgroundColor: theme.palette.gray[0],
              borderRadius: theme.radius[3],
              overflow: "hidden",
              width: style?.base?.content?.width ?? "40%",
              maxWidth: style?.base?.content?.maxWidth ?? "400px",
              touchAction: "none",

              ...(dragOffset !== 0 && {
                transform:
                  dragInfo.axis === "X"
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

              [theme.breakpoints.down("md")]: {
                width: style?.mediumScreen?.content?.width ?? "80%",
                maxWidth: style?.mediumScreen?.content?.maxWidth ?? "350px",
                ...style?.mediumScreen?.content,
              },
              [theme.breakpoints.down("sm")]: {
                width: style?.smallScreen?.content?.width ?? "89%",
                maxWidth: style?.smallScreen?.content?.maxWidth ?? "100%",
                ...style?.smallScreen?.content,
              },
            }}>
            {/* Header */}

            {showHeader && isMobile && dragInfo.axis === "Y" && (
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
            {/* Header */}
            {(header || clickToClose) && (
              <Stack
                direction={"row"}
                sx={{
                  width: "100%",
                  position: "sticky",
                  alignItems: "center",
                  justifyContent: "flex-end",
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
            {/* Content */}
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
          </A11y>
        </Transition>
      </Stack>
    );
  },
);
Drawer.displayName = "Drawer";

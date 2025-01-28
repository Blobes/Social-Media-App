"use client";

import React from "react";
import { Box, IconButton, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Close } from "@mui/icons-material";
import { fadeIn, fadeOut, moveIn, moveOut } from "../helpers/animations";
import { useStyles } from "@/shared/helpers/styles";

interface DrawerProps {
  hide?: { xs?: Boolean; md?: Boolean };
  triggerElement: React.ReactNode;
  children: {
    headerElement?: React.ReactNode;
    contentElement: React.ReactNode;
  };
  entryDir?: "LEFT" | "RIGHT";
}
export const Drawer = ({
  hide = { xs: false, md: false },
  triggerElement,
  children,
  entryDir = "RIGHT",
}: DrawerProps) => {
  const [isOpen, setOpen] = React.useState(false);
  const [shouldRemove, handleRemove] = React.useState(true);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const { headerElement, contentElement } = children;
  const { scrollBarStyle } = useStyles();

  const handleOpen = () => {
    setTimeout(() => handleRemove(false), 50);
    setTimeout(() => setOpen(true), 50);
  };
  const handleClose = (
    e: React.MouseEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    if (
      (containerRef.current && e.target === containerRef.current) ||
      (closeRef.current && closeRef.current.contains(e.target as HTMLElement))
    ) {
      setOpen(false);
      setTimeout(() => handleRemove(true), 200);
    }
  };
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: {
          xs: hide.xs ? "none" : "flex",
          md: hide.md ? "none" : "flex",
        },
      }}>
      {/* Drawer Trigger Element */}
      <Box
        aria-label="Menu drawer opener"
        aria-controls="open-menu-drawer"
        aria-haspopup="true"
        onClick={handleOpen}
        sx={{
          borderRadius: theme.radius.full,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "30px",
          height: "30px",
          color: "inherit",
        }}>
        {triggerElement}
      </Box>

      {/* Drawer Overlay Container */}
      <Stack
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: shouldRemove ? "none" : "inherit",
          opacity: isOpen ? 1 : 0,
          animation: !isOpen
            ? `${fadeOut} 0.2s linear`
            : `${fadeIn} 0.2s linear`,
          alignItems: entryDir === "LEFT" ? "flex-start" : "flex-end",
          justifyContent: "center",
          padding: {
            xs: theme.boxSpacing(4, 2),
            sm: theme.boxSpacing(6, 4),
          },
          backgroundColor: theme.palette.gray.trans.overlay,
        }}
        ref={containerRef}
        onClick={handleClose}>
        {/* Drawer Content Container */}
        <Stack
          sx={{
            height: "100%",
            [theme.breakpoints.down("md")]: {
              width: "40%",
              minWidth: "350px",
            },
            [theme.breakpoints.down("sm")]: {
              width: "80%",
              minWidth: "250px",
              maxWidth: "350px",
            },
            [theme.breakpoints.down("xs")]: {
              minWidth: "250px",
            },
            gap: theme.gap(0),
            backgroundColor: theme.palette.gray[0],
            borderRadius: theme.radius[3],
            border: `1px solid ${theme.palette.gray.trans[1]}`,
            overflow: "auto",
            animation: !isOpen
              ? `${moveOut(entryDir, "4px", "-10px")} 0.2s linear forwards`
              : `${moveIn(entryDir, "-10px", "4px")} 0.2s linear forwards`,
            ...scrollBarStyle(),
          }}>
          {/* Drawer Content Header Section */}
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
            {/* Drawer Header Element */}
            {headerElement && headerElement}
            {/* Drawer Closing Trigger Element */}
            <IconButton
              aria-label="Menu drawer closer"
              aria-controls="close-menu-drawer"
              aria-haspopup="true"
              ref={closeRef}
              onClick={handleClose}>
              <Close
                sx={{
                  width: "20px",
                  height: "20px",
                }}
              />
            </IconButton>
          </Stack>
          {/* Drawer Content Element */}
          {contentElement}
        </Stack>
      </Stack>
    </Box>
  );
};

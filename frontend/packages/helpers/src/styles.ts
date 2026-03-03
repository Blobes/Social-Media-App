"use client";

import { img } from "@repo/assets";
import { rotate } from "./animations";

export const scrollBarStyle = (theme: any) => {
  return {
    "&::-webkit-scrollbar": {
      height: "6px",
      width: "6px",
      [theme.breakpoints.down("md")]: {
        height: "2px",
        width: "2px",
      },
    },
    "&::-webkit-scrollbar-track": {
      borderRadius: theme.radius[2],
      margin: "0px 8px",
    },
    "&::-webkit-scrollbar-thumb": {
      background: theme.palette.gray[100] /* Scrollbar color */,
      borderRadius: theme.radius[2],
      boxShadow: "inset 0 0 4px 4px rgba(0, 0, 0, 0.1)",
    },
    "&::-webkit-scrollbar-thumb:hover": {
      background: theme.palette.gray.trans[2] /* Color on hover */,
    },
  };
};

export const autoScroll = () => ({
  base: {
    overflowY: "auto",
    height: "100%",
    "&::-webkit-scrollbar": {
      width: "0px",
    },
  },
  mobile: {
    height: "fit-content",
    width: "100%",
    overflowY: "unset",
  },
});

export const applyBGPattern = () => ({
  "& > *": { zIndex: 5 }, // Keep the parent container at the top
  "&::before": {
    content: '""',
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `url(${img.doodle})`,
    backgroundRepeat: "repeat",
    backgroundSize: "800px",
    opacity: 0.3,
    zIndex: 0,
  },
});

export const applyBGEffects = (theme: any) => ({
  // Fade in the overlay
  overlay: {
    "&::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      bgcolor: theme.fixedColors.gray800,
      opacity: 0,
      zIndex: 2,
      transition: "opacity 0.4s ease",
      pointerEvents: "none",
    },
    "&:hover": {
      "&::before": { opacity: 0.4 },
    },
  },
  // Apply zoom to the internal box
  zoom: (element: string = ".MuiBox-root") => ({
    [`${element}`]: {
      transition: "transform 0.6s ease",
    },
    "&:hover": {
      [`${element}`]: { transform: "scale(1.05)" },
    },
  }),

  blur: (isActive?: boolean, offset?: number) => ({
    backdropFilter:
      isActive && offset
        ? `blur(${isActive ? Math.max(0, 6 - offset / 50) : 0}px)`
        : "blur(6px)",
  }),

  opaque: (isActive?: boolean, offset?: number) => ({
    backgroundColor:
      isActive && offset
        ? theme.palette.gray.trans.overlay(isActive ? 0.6 - offset / 400 : 0)
        : theme.palette.gray.trans.overlay(0.6),
  }),
});

interface BorderParams {
  borderWidth?: number;
  duration?: string;
  borderColor?: string;
  borderRadius?: string;
}
export const animatedBorder = ({
  borderWidth = 1,
  duration = "20s",
  borderColor,
  borderRadius,
}: BorderParams) => {
  const magicColorMix = `linear-gradient( #7928ca, #0070f3, #00dfd8)`;
  return {
    position: "relative",
    zIndex: 0,
    overflow: "hidden",
    borderRadius: borderRadius,

    "&::before": {
      content: '""',
      position: "absolute",
      zIndex: -2,
      left: "-50%",
      top: "-50%",
      width: "300%",
      height: "300%",
      background: borderColor || magicColorMix,
      animation: `${rotate} ${duration} linear infinite`,
    },

    "&::after": {
      content: '""',
      position: "absolute",
      zIndex: -1,
      inset: borderWidth,
      borderRadius: borderRadius,
      backgroundColor: "inherit",
    },
  };
};

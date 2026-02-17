"use client";

import { useTheme } from "@mui/material/styles";
import { img } from "@funstakes/assets";
import { zIndexes } from "@funstakes/helpers";
import { useMisc } from "./useMisc";

export const useStyles = () => {
  const theme = useTheme();
  const { isDesktop } = useMisc();

  const scrollBarStyle = () => {
    return {
      "&::-webkit-scrollbar": {
        height: isDesktop ? "6px" : "2px",
        width: isDesktop ? "6px" : "2px",
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

  const autoScroll = () => ({
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

  const applyBGPattern = () => ({
    "& > *": { zIndex: zIndexes[5] }, // Keep the parent container at the top
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `url(${img.doodle})`,
      backgroundRepeat: "repeat",
      backgroundSize: "800px",
      opacity: 0.3,
      zIndex: zIndexes.minimum,
    },
  });

  const applyBGEffect = (effect: string) => ({
    "&::before": {
      content: '""',
      position: "absolute",
      inset: "-20%",
      background: effect, // Created from processVibrantColor
      filter: "blur(80px) saturate(3.5)", // CRITICAL: High saturation and blur
      opacity: 0.8,
      zIndex: 0,
    },
    "&::after": {
      content: '""',
      position: "absolute",
      inset: 0,
      // Adds that high-end white glossy tint
      background: `linear-gradient(135deg, 
      rgba(255,255,255,0.5) 0%, 
      rgba(255,255,255,0) 100%)`,
      border: "1px solid rgba(255, 255, 255, 0.3)", // The "edge" of the glass
      zIndex: 1,
    },
  });

  const applyBGEffects = {
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
  };

  return {
    scrollBarStyle,
    autoScroll,
    applyBGPattern,
    applyBGEffect,
    applyBGEffects,
  };
};

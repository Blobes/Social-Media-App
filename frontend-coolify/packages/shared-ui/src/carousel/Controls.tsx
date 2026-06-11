"use client";

import React from "react";
import { Box, IconButton } from "@mui/material";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { GenericStyle } from "@repo/core";

interface ArrowProps {
  onPrev: () => void;
  onNext: () => void;
  disableLeft?: boolean;
  disableRight?: boolean;
  style?: {
    arrowLeft?: GenericStyle;
    arrowRight?: GenericStyle;
  };
}
export const CarouselArrows = ({
  onPrev,
  onNext,
  disableLeft,
  disableRight,
  style,
}: ArrowProps) => {
  const theme = useTheme();

  const sharedStyle = {
    position: "absolute",
    top: "50%",
    zIndex: 10,
    bgcolor: theme.palette.gray.trans.overlay(0.3),
    transition: "stroke 0.3s ease, background-color 0.3s ease",
    "& svg": {
      stroke: "#ffffff",
    },
    "&:hover": {
      opacity: 0.8,
      bgcolor: theme.fixedColors.gray800,
      "& svg": {
        stroke: theme.fixedColors.gray50,
      },
    },
  };

  return (
    <>
      <IconButton
        data-no-doubletap
        onClick={() => {
          onPrev();
        }}
        disabled={disableLeft}
        sx={{
          ...sharedStyle,
          left: style?.arrowLeft?.left || 10,
          ...(style?.arrowLeft as any),
          [theme.breakpoints.down("sm")]: {
            ...(style?.arrowLeft?.smScreen as any),
          },
        }}>
        <ChevronLeft />
      </IconButton>
      <IconButton
        data-no-doubletap
        onClick={onNext}
        disabled={disableRight}
        sx={{
          ...sharedStyle,
          right: style?.arrowRight?.left || 10,
          ...(style?.arrowRight as any),
          [theme.breakpoints.down("sm")]: {
            ...(style?.arrowRight?.smScreen as any),
          },
        }}>
        <ChevronRight />
      </IconButton>
    </>
  );
};

interface DotProps {
  length: number;
  current: number;
  onGoTo: (i: number) => void;
  interval: number;
  autoPlay: boolean;
}

/**
 * Pagination tracking indicators with a sliding window layout for high slide counts.
 */
export const CarouselDots = ({
  length,
  current,
  onGoTo,
  interval,
  autoPlay,
}: DotProps) => {
  const theme = useTheme();
  const MAX_VISIBLE = 5;

  // Calculate sliding window boundaries
  let startIdx = 0;
  let endIdx = length - 1;

  if (length > MAX_VISIBLE) {
    const half = Math.floor(MAX_VISIBLE / 2);
    startIdx = current - half;
    endIdx = current + half;

    // Adjust if window overflows the left boundary
    if (startIdx < 0) {
      startIdx = 0;
      endIdx = MAX_VISIBLE - 1;
    }

    // Adjust if window overflows the right boundary
    if (endIdx >= length) {
      endIdx = length - 1;
      startIdx = length - MAX_VISIBLE;
    }
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: theme.gap(2),
        py: theme.boxSpacing(2),
        overflow: "hidden",
        flex: "none",
      }}>
      {Array.from({ length }).map((_, i) => {
        const isActive = i === current;
        const isVisible = i >= startIdx && i <= endIdx;

        // Render nothing if item falls outside the extended boundary rules
        if (!isVisible) return null;

        // Determine edge indicators for mini scaling effects
        const isLeftEdge = i === startIdx && startIdx > 0;
        const isRightEdge = i === endIdx && endIdx < length - 1;

        let dotScale = 1;
        if (isLeftEdge || isRightEdge) {
          dotScale = 0.6; // Scale down edge indicators to match design
        }

        return (
          <Box
            key={i}
            onClick={() => onGoTo(i)}
            sx={{
              position: "relative",
              width: isActive ? 24 : 8,
              height: 8,
              borderRadius: theme.radius.full,
              cursor: "pointer",
              bgcolor: theme.fixedColors.grayTrans(0.6),
              "&:hover": {
                bgcolor: theme.fixedColors.grayTrans(1),
              },
              overflow: "hidden",
              transform: `scale(${dotScale})`,
              transition:
                "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease",
            }}>
            {isActive && (
              <Box
                component={motion.div}
                initial={{ width: autoPlay ? "0%" : "100%" }}
                animate={{ width: "100%" }}
                transition={{
                  duration: autoPlay ? interval / 1000 : 0,
                  ease: "linear",
                }}
                sx={{
                  position: "absolute",
                  height: "100%",
                  bgcolor: theme.palette.primary.light,
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
};

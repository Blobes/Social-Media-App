"use client";

import React from "react";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { useStackedCarousel } from "./useStacked";
import { CarouselDots } from "./Controls";
import { GenericStyle } from "@repo/core";

export interface StackedCarouselStyle {
  container?: GenericStyle;
  viewport?: GenericStyle;
  item?: React.CSSProperties;
}

interface StackedCarouselProps {
  items: React.ReactNode[];
  style?: StackedCarouselStyle;
  autoPlay?: boolean;
  pauseOnHover?: boolean;
  interval?: number;
  setCurrentIndex?: (index: number) => void;
}

/**
 * Presentation layer for stacked deck layouts driven by absolute z-index scaling transformations.
 */
export const StackedCarousel = ({
  items,
  style,
  autoPlay = false,
  pauseOnHover = true,
  interval = 5000,
  setCurrentIndex,
}: StackedCarouselProps) => {
  const theme = useTheme();

  const {
    currentIndex,
    visibleItems,
    dragX,
    dragY,
    isPaused,
    goTo,
    handleDragEnd,
    setPauseState,
  } = useStackedCarousel(items.length, interval, autoPlay, setCurrentIndex);

  if (!items.length) return null;

  return (
    <Box
      onMouseEnter={() => pauseOnHover && setPauseState(true)}
      onMouseLeave={() => setPauseState(false)}
      onTouchStart={() => pauseOnHover && setPauseState(true)}
      onTouchEnd={() => setPauseState(false)}
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        gap: theme.gap(8),
        flex: "none",
        userSelect: "none",
        ...style?.container,
      }}>
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          flex: "1 1 0%",
          minHeight: 0,
          ...style?.viewport,
        }}>
        {visibleItems.map(({ itemIndex, depthIndex }) => {
          const isTopCard = depthIndex === 0;

          // Spatial scaling computations based on stack depth positions
          const scale = 1 - depthIndex * 0.05;
          const translateY = depthIndex * 12;
          const zIndex = 10 - depthIndex;

          return (
            <motion.div
              key={itemIndex}
              drag={isTopCard ? "x" : false}
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.6}
              onDragEnd={handleDragEnd}
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "absolute",
                zIndex,
                // Apply dynamic drag expressions exclusively to the topmost structural slide element
                x: isTopCard ? dragX : 0,
                y: isTopCard ? dragY : translateY,
                scale,
                cursor: isTopCard ? "grab" : "default",
                ...style?.item,
              }}
              whileTap={isTopCard ? { cursor: "grabbing" } : {}}>
              {items[itemIndex]}
            </motion.div>
          );
        })}
      </Box>

      {items.length > 1 && (
        <CarouselDots
          length={items.length}
          current={currentIndex}
          onGoTo={goTo}
          interval={interval}
          autoPlay={autoPlay && !isPaused}
        />
      )}
    </Box>
  );
};

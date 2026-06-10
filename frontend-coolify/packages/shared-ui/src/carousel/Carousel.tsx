"use client";

import React from "react";
import { Box } from "@mui/material";
import { motion, useTransform } from "framer-motion";
import { useCarousel } from "./useCarousel";
import { CarouselArrows, CarouselDots } from "./Controls";
import { useTheme } from "@mui/material/styles";
import { GenericStyle } from "@repo/core";

export interface CarouselStyle {
  container?: GenericStyle;
  item?: React.CSSProperties;
  arrowLeft?: GenericStyle;
  arrowRight?: GenericStyle;
}

interface CarouselProps {
  items: React.ReactNode[];
  style?: CarouselStyle;
  showArrows?: boolean;
  autoPlay?: boolean;
  pauseOnHover?: boolean;
  interval?: number;
  setCurrentIndex?: (index: number) => void;
  initialIndex?: number;
  isMultiView?: boolean;
  variant?: "stacked" | "linear";
  loop?: boolean;
}

/**
 * Universal slider presentation layer powered by a single continuous drag engine.
 */
export const Carousel = ({
  items,
  style,
  showArrows = true,
  autoPlay = false,
  pauseOnHover = true,
  interval = 5000,
  setCurrentIndex,
  initialIndex = 0,
  isMultiView = false,
  variant = "stacked",
  loop = true,
}: CarouselProps) => {
  const theme = useTheme();

  const {
    index,
    containerRef,
    virtualIndex,
    isPaused,
    next,
    prev,
    goTo,
    handleDrag,
    handleDragEnd,
    setPauseState,
    trackX,
    isNavigating,
    isDragging,
    getItemProgress,
    visibleItems,
    isFirst,
    isLast,
  } = useCarousel(
    items.length,
    interval,
    autoPlay,
    initialIndex,
    isMultiView,
    setCurrentIndex,
    variant,
    loop,
  );
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
        ref={containerRef}
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          flex: "1 1 0%",
          minHeight: 0,
          touchAction: "pan-y",
        }}>
        <motion.div
          drag="x"
          dragMomentum={false}
          dragConstraints={{ left: -5000, right: 5000 }}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          style={{
            display: "flex",
            height: "100%",
            width: "100%",
            position: "absolute",
            left: 0,
            top: 0,
            cursor: isLast && !loop ? "default" : "grab",
            x: trackX,
          }}
          whileTap={isLast && !loop ? {} : { cursor: "grabbing" }}>
          {visibleItems.map(({ structuralIndex, itemIndex }) => {
            const isCentered = structuralIndex === index;
            const scale = useTransform(trackX, (currentTrackX) => {
              const progress = getItemProgress(structuralIndex, currentTrackX);
              return 1 - progress * 0.1;
            });
            const opacity = useTransform(trackX, (currentTrackX) => {
              const progress = getItemProgress(structuralIndex, currentTrackX);
              if (isMultiView) return 1 - progress * 0.4;
              if (isDragging || isNavigating)
                return Math.max(0, 1 - progress * 0.5);
              return isCentered ? 1 : 0;
            });

            return (
              <motion.div
                key={structuralIndex}
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  flexShrink: 0,
                  position: "relative",
                  zIndex: isCentered ? 5 : 2,
                  scale,
                  opacity,
                  ...style?.item,
                }}>
                {items[itemIndex]}
              </motion.div>
            );
          })}
        </motion.div>
      </Box>
      {showArrows && items.length > 1 && (
        <CarouselArrows
          onPrev={prev}
          onNext={next}
          disableLeft={isFirst}
          disableRight={isLast}
          style={{
            arrowLeft: style?.arrowLeft,
            arrowRight: style?.arrowRight,
          }}
        />
      )}
      {items.length > 1 && (
        <CarouselDots
          length={items.length}
          current={virtualIndex}
          onGoTo={goTo}
          interval={interval}
          autoPlay={autoPlay && !isPaused}
        />
      )}
    </Box>
  );
};

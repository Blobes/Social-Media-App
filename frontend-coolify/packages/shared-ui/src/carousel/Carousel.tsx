"use client";

import React, { useState } from "react";
import { Box } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useCarousel } from "./useCarousel";
import { CarouselArrows, CarouselDots } from "./Controls";
import { useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { GenericStyle } from "@repo/core";

export interface CarouselStyle {
  container?: GenericStyle;
  item?: React.CSSProperties;
}

interface CarouselProps {
  items: React.ReactNode[];
  style?: CarouselStyle;
  showArrows?: boolean;
  autoPlay?: boolean;
  pauseOnHover?: boolean; // New prop
  interval?: number;
  setCurrentIndex?: (index: number) => void;
  initialIndex?: number;
}

export const Carousel = ({
  items,
  style,
  showArrows = true,
  autoPlay = false,
  pauseOnHover = true,
  interval = 5000,
  setCurrentIndex,
  initialIndex = 0,
}: CarouselProps) => {
  const [isPaused, setIsPaused] = useState(false);
  const theme = useTheme();

  const { variants, index, direction, next, prev, goTo } = useCarousel(
    items.length,
    interval,
    autoPlay && !isPaused, // Inject pause logic into hook
    initialIndex,
  );

  useEffect(() => {
    setCurrentIndex?.(index);
  }, [index, setCurrentIndex]);

  if (!items.length) return null;

  return (
    <Box
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        gap: theme.gap(8),
        flex: "none",
        ...style?.container,
      }}>
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          width: "100%",
          flex: "1 1 0%",
          minHeight: 0,
        }}>
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              ...style?.item,
            }}>
            {items[index]}
          </motion.div>
        </AnimatePresence>

        {showArrows && items.length > 1 && (
          <CarouselArrows onPrev={prev} onNext={next} />
        )}
      </Box>

      {items.length > 1 && (
        <CarouselDots
          length={items.length}
          current={index}
          onGoTo={goTo}
          interval={interval}
          autoPlay={autoPlay && !isPaused}
        />
      )}
    </Box>
  );
};

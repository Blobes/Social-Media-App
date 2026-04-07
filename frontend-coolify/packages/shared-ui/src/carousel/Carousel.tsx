"use client";

import React from "react";
import { Box, SxProps, Theme } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";

import { useCarousel } from "./useCarousel";
import { CarouselArrows, CarouselDots } from "./Controls";
import { useEffect } from "react";

export interface CarouselStyle {
  container?: SxProps<Theme>;
  item?: React.CSSProperties;
}

interface CarouselProps {
  items: React.ReactNode[];
  style?: CarouselStyle;
  showArrows?: boolean;
  autoPlay?: boolean;
  interval?: number;
  setCurrentIndex?: (index: number) => void;
}

export const Carousel = ({
  items,
  style,
  showArrows = true,
  autoPlay = false,
  interval,
  setCurrentIndex,
}: CarouselProps) => {
  const { variants, index, direction, next, prev, goTo } = useCarousel(
    items.length,
    interval,
    autoPlay,
  );

  // Wrapper for callback
  const handleAction = (action: () => void) => {
    action();
  };

  useEffect(() => {
    setCurrentIndex?.(index);
  }, [index, setCurrentIndex]);

  if (!items.length) return null;

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        ...style?.container,
      }}>
      <Box
        sx={{
          position: "relative",
          flex: 1,
          display: "flex",
          alignItems: "center",
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
          <CarouselArrows
            onPrev={() => handleAction(prev)}
            onNext={() => handleAction(next)}
          />
        )}
      </Box>

      {items.length > 1 && (
        <CarouselDots
          length={items.length}
          current={index}
          onGoTo={(i) => handleAction(() => goTo(i))}
        />
      )}
    </Box>
  );
};

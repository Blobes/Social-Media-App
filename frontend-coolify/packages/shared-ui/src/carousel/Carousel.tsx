"use client";

import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
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
  visibleCount?: number;
  variant?: "stacked" | "linear"; // Toggle between stacked overlapping slides or a side-by-side linear layout
}

/**
 * Handles slider view configurations featuring center-snapped linear arrays or dimension-offset stacked layouts.
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
  visibleCount = 1,
  variant = "stacked",
}: CarouselProps) => {
  const [isPaused, setIsPaused] = useState(false);
  const theme = useTheme();

  const { variants, index, direction, next, prev, goTo, visibleIndices } =
    useCarousel(
      items.length,
      interval,
      autoPlay && !isPaused,
      initialIndex,
      visibleCount,
    );

  useEffect(() => {
    setCurrentIndex?.(index);
  }, [index, setCurrentIndex]);

  if (!items.length) return null;

  const isMultiView = visibleCount > 1;
  const isLinear = variant === "linear";
  const itemWidthPercentage = (100 * visibleCount - 100) / visibleCount;

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
        gap: theme.gap(8),
        flex: "none",
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
        }}>
        {isMultiView ? (
          isLinear ? (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                overflow: "visible",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
              }}>
              <motion.div
                animate={{
                  x: `-${index * itemWidthPercentage}%`,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                style={{
                  display: "flex",
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  // left: `${(visibleCount - 1) * (itemWidthPercentage / 2)}%`, // Initialize alignment offsets for standard screen matching
                }}>
                {items.map((item, itemIdx) => {
                  const isActive = itemIdx === index;
                  return (
                    <motion.div
                      key={itemIdx}
                      animate={{
                        scale: isActive ? 1 : 0.85,
                        opacity: isActive ? 1 : 0.5,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                      style={{
                        width: isActive ? "98%" : `${itemWidthPercentage}%`,
                        height: "100%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        flexShrink: 0,
                        ...style?.item,
                      }}>
                      {item}
                    </motion.div>
                  );
                })}
              </motion.div>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                width: "100%",
                height: "100%",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
              }}>
              {visibleIndices.map((itemIndex, orderIdx) => {
                const sideCount = Math.floor(visibleCount / 2);
                const relativeOffset = orderIdx - sideCount;
                const isActive = itemIndex === index;

                return (
                  <motion.div
                    key={itemIndex}
                    animate={{
                      x: `${
                        relativeOffset *
                        (visibleCount > 2
                          ? itemWidthPercentage
                          : itemWidthPercentage * 2)
                      }%`,
                      scale: isActive ? 1 : 0.85,
                      opacity: isActive ? 1 : 0.5,
                      zIndex: isActive ? 5 : 2,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                    style={{
                      position: "absolute",
                      width: isActive ? "98%" : `${itemWidthPercentage}%`,
                      height: "100%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flexShrink: 0,
                      ...style?.item,
                    }}>
                    {items[itemIndex]}
                  </motion.div>
                );
              })}
            </Box>
          )
        ) : (
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
        )}

        {showArrows && items.length > 1 && (
          <CarouselArrows
            onPrev={prev}
            onNext={next}
            style={{
              arrowLeft: style?.arrowLeft,
              arrowRight: style?.arrowRight,
            }}
          />
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

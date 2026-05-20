"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Manages carousel state with support for external pausing and dynamic navigation.
 */
export const useCarousel = (
  length: number,
  interval = 5000,
  autoPlay = false,
  initialIndex = 0,
) => {
  const safeInitialIndex =
    length > 0 ? Math.min(Math.max(initialIndex, 0), length - 1) : 0;

  const [index, setIndex] = useState(safeInitialIndex);
  const [direction, setDirection] = useState(0);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  const next = useCallback(() => {
    setDirection(1);
    setIndex((prev) => (prev + 1 === length ? 0 : prev + 1));
  }, [length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setIndex((prev) => (prev === 0 ? length - 1 : prev - 1));
  }, [length]);

  const goTo = (i: number) => {
    if (i === index) return;
    setDirection(i > index ? 1 : -1);
    setIndex(i);
  };

  useEffect(() => {
    if (!autoPlay || length <= 1) return;

    const timer = setInterval(() => {
      next();
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, next, length]);

  return { variants, index, direction, next, prev, goTo };
};

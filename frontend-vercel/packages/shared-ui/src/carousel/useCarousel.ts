"use client";

import { useState, useEffect } from "react";

export const useCarousel = (
  length: number,
  interval = 5000,
  autoPlay = false,
) => {
  const [index, setIndex] = useState(0);
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
      // Optional: scale: 0.9 (adds a slight zoom-out feel)
    }),
  };

  const next = () => {
    setDirection(1);
    setIndex((prev) => (prev + 1 === length ? 0 : prev + 1));
  };

  const prev = () => {
    setDirection(-1);
    setIndex((prev) => (prev === 0 ? length - 1 : prev - 1));
  };

  const goTo = (i: number) => {
    setDirection(i > index ? 1 : -1);
    setIndex(i);
  };

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, index]);

  return { variants, index, direction, next, prev, goTo };
};

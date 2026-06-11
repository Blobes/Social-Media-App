"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { PanInfo, useMotionValue, animate } from "framer-motion";

/**
 * Manages spatial stack index layouts, absolute layout scaling offsets, and drag escapes.
 */
export const useStackedCarousel = (
  length: number,
  interval = 5000,
  autoPlay = false,
  setCurrentIndex?: (index: number) => void,
) => {
  const [currentIndex, setLocalIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const isNavigating = useRef(false);

  /**
   * Rotates the deck layout forward to reveal the subsequent index slide.
   */
  const next = useCallback(() => {
    if (length <= 1 || isNavigating.current) return;
    isNavigating.current = true;

    setLocalIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % length;
      setCurrentIndex?.(nextIndex);
      return nextIndex;
    });

    setTimeout(() => {
      isNavigating.current = false;
    }, 400);
  }, [length, setCurrentIndex]);

  /**
   * Rotates the deck layout backward to return to the preceding index slide.
   */
  const prev = useCallback(() => {
    if (length <= 1 || isNavigating.current) return;
    isNavigating.current = true;

    setLocalIndex((prevIndex) => {
      const nextIndex = (prevIndex - 1 + length) % length;
      setCurrentIndex?.(nextIndex);
      return nextIndex;
    });

    setTimeout(() => {
      isNavigating.current = false;
    }, 400);
  }, [length, setCurrentIndex]);

  /**
   * Directly matches and shifts the active index placement to any selected deck value.
   */
  const goTo = useCallback(
    (targetIndex: number) => {
      if (
        targetIndex === currentIndex ||
        targetIndex < 0 ||
        targetIndex >= length
      )
        return;
      setLocalIndex(targetIndex);
      setCurrentIndex?.(targetIndex);
    },
    [currentIndex, length, setCurrentIndex],
  );

  const handleDragEnd = useCallback(
    async (_: any, info: PanInfo) => {
      if (length <= 1) return;
      const swipeThreshold = 120;
      const { offset, velocity } = info;

      // Trigger structural deck changes if raw offsets pass cross thresholds
      if (offset.x < -swipeThreshold || velocity.x < -500) {
        setIsPaused(true);
        await animate(dragX, -400, { velocity: velocity.x, duration: 0.2 });
        next();
        dragX.set(0);
        setIsPaused(false);
      } else if (offset.x > swipeThreshold || velocity.x > 500) {
        setIsPaused(true);
        await animate(dragX, 400, { velocity: velocity.x, duration: 0.2 });
        prev();
        dragX.set(0);
        setIsPaused(false);
      } else {
        animate(dragX, 0, { type: "spring", stiffness: 300, damping: 25 });
        animate(dragY, 0, { type: "spring", stiffness: 300, damping: 25 });
      }
    },
    [dragX, dragY, length, next, prev],
  );

  const setPauseState = useCallback((paused: boolean) => {
    setIsPaused(paused);
  }, []);

  /**
   * Sorts visual priorities and spatial offsets based on position relative to the active card.
   */
  const visibleItems = useMemo(() => {
    if (length === 0) return [];

    const result = [];
    // Show up to 3 stacked cards simultaneously for performance safety
    const visibleCount = Math.min(length, 3);

    for (let i = 0; i < visibleCount; i++) {
      const itemIndex = (currentIndex + i) % length;
      result.push({
        itemIndex,
        depthIndex: i, // 0 means active topmost card, 1 means middle card, etc.
      });
    }

    // Reverse order allows correct stack ordering where depthIndex 0 renders above others
    return result.reverse();
  }, [currentIndex, length]);

  return {
    currentIndex,
    visibleItems,
    dragX,
    dragY,
    isPaused,
    next,
    prev,
    goTo,
    handleDragEnd,
    setPauseState,
  };
};

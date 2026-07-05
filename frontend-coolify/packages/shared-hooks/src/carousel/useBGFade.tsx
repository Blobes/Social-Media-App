"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export const useBGFadeCarousel = (
  length: number,
  interval = 5000,
  autoPlay = true,
  initialIndex = 0,
  onIndexChange?: (index: number) => void,
  shouldResetOnEnd = true, // Flag determining if the tracker auto-returns or resets to the first slide
  onSlideEnd?: () => void, // Optional callback executed when reaching the final slide sequence boundaries
) => {
  const safeInitialIndex =
    length > 0 ? Math.min(Math.max(initialIndex, 0), length - 1) : 0;

  const [currentIndex, setCurrentIndex] = useState(safeInitialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const longPressActiveRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (targetIndex: number) => {
      if (targetIndex < 0 || targetIndex >= length) return;
      setCurrentIndex(targetIndex);
      onIndexChange?.(targetIndex);
    },
    [length, onIndexChange],
  );

  const next = useCallback(() => {
    const isAtEnd = currentIndex === length - 1;

    if (isAtEnd) {
      onSlideEnd?.();
      if (shouldResetOnEnd) {
        goTo(0);
      }
      return;
    }

    goTo(currentIndex + 1);
  }, [currentIndex, length, goTo, shouldResetOnEnd, onSlideEnd]);

  const prev = useCallback(() => {
    const prevIndex = (currentIndex - 1 + length) % length;
    goTo(prevIndex);
  }, [currentIndex, length, goTo]);

  const setPauseState = useCallback((paused: boolean) => {
    setIsPaused(paused);
  }, []);

  const handleTapNavigation = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, enableEdgeTap: boolean) => {
      if (longPressActiveRef.current) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (!enableEdgeTap || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const threshold = rect.width * 0.2;

      if (clickX < threshold) {
        prev();
      } else if (clickX > rect.width - threshold) {
        next();
      }
    },
    [next, prev],
  );

  const handlePressStart = useCallback(
    (enablePressToHide: boolean, pauseOnHover: boolean) => {
      longPressActiveRef.current = false;
      if (enablePressToHide) {
        setIsPressed(true);
        longPressActiveRef.current = true;
      }
      if (pauseOnHover) setPauseState(true);
    },
    [setPauseState],
  );

  const handlePressEnd = useCallback(
    (enablePressToHide: boolean) => {
      if (enablePressToHide) {
        setTimeout(() => {
          longPressActiveRef.current = false;
        }, 50);
        setIsPressed(false);
      }
      setPauseState(false);
    },
    [setPauseState],
  );

  useEffect(() => {
    // If autoPlay is on but we should not reset on end, clear the interval once we land on the last item
    const isAtEnd = currentIndex === length - 1;
    if (
      !autoPlay ||
      isPaused ||
      isPressed ||
      length <= 1 ||
      (isAtEnd && !shouldResetOnEnd)
    ) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      next();
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [
    autoPlay,
    isPaused,
    isPressed,
    currentIndex,
    length,
    interval,
    next,
    shouldResetOnEnd,
  ]);

  return {
    currentIndex,
    isPaused,
    isPressed,
    containerRef,
    next,
    prev,
    goTo,
    setPauseState,
    handleTapNavigation,
    handlePressStart,
    handlePressEnd,
    isFirst: currentIndex === 0,
    isLast: currentIndex === length - 1,
  };
};

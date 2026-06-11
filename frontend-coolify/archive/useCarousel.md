"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { PanInfo, useMotionValue, useTransform, animate } from "framer-motion";

/**
 * Manages spotlight centering state engines, drag metrics, and infinite scroll loops.
 */
export const useCarousel = (
  length: number,
  interval = 5000,
  autoPlay = false,
  initialIndex = 0,
  isMultiView = false,
  setCurrentIndex?: (index: number) => void,
  variant: "stacked" | "linear" = "stacked",
  loop = true,
) => {
  const safeInitialIndex =
    length > 0 ? Math.min(Math.max(initialIndex, 0), length - 1) : 0;
  const cloneCount = length > 0 ? (loop ? (isMultiView ? 4 : 2) : 0) : 0;

  const [index, setIndex] = useState(safeInitialIndex + cloneCount);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const dragX = useMotionValue(0);
  const indexMV = useMotionValue(index);
  const containerWidthMV = useMotionValue(400);
  const containerRef = useRef<HTMLDivElement>(null);

  const virtualIndex = useMemo(() => {
    if (length <= 0) return 0;
    if (!loop) return index;
    return (index - cloneCount + length * 10) % length;
  }, [index, cloneCount, length, loop]);

  const commitIndex = useCallback(
    (newIndex: number) => {
      setIndex(newIndex);
      indexMV.set(newIndex);
    },
    [index],
  );

  const setPauseState = useCallback(
    (paused: boolean) => {
      setIsPaused(paused);
    },
    [setIsPaused],
  );

  const finishSwipe = useCallback(
    async (targetIndex: number, dir: number) => {
      const computedItemWidth = containerWidthMV.get() * 1;
      const itemsToJump = Math.abs(targetIndex - index);
      const finalDragX =
        dir > 0
          ? -computedItemWidth * itemsToJump
          : computedItemWidth * itemsToJump;

      setIsNavigating(true);
      await animate(dragX, finalDragX, {
        type: "spring",
        stiffness: 400,
        damping: 38,
      });

      let finalIndex = targetIndex;
      if (loop) {
        if (targetIndex < cloneCount) {
          finalIndex = targetIndex + length;
        } else if (targetIndex >= cloneCount + length) {
          finalIndex = targetIndex - length;
        }
      } else finalIndex = Math.min(Math.max(targetIndex, 0), length - 1);
      commitIndex(finalIndex);
      dragX.set(0);
      setIsNavigating(false);
    },
    [dragX, length, cloneCount, commitIndex, containerWidthMV, index, loop],
  );

  const next = useCallback(async () => {
    if (!loop && index >= length - 1) return;
    await finishSwipe(index + 1, 1);
  }, [index, finishSwipe, loop, length]);

  const prev = useCallback(async () => {
    if (!loop && index <= 0) return;
    await finishSwipe(index - 1, -1);
  }, [index, finishSwipe, loop]);

  const goTo = useCallback(
    async (i: number) => {
      const targetStructuralIndex = loop ? i + cloneCount : i;
      if (targetStructuralIndex === index) return;
      const dir = targetStructuralIndex > index ? 1 : -1;
      await finishSwipe(targetStructuralIndex, dir);
    },
    [index, finishSwipe, cloneCount, loop],
  );

  const handleDrag = useCallback(
    (_: any, info: PanInfo) => {
      setPauseState(true);
      const isStartIdx = index === 0 && info.offset.x > 0;
      const isEndIdx = index === length - 1 && info.offset.x < 0;
      if (!loop && (isStartIdx || isEndIdx)) {
        dragX.set(0);
        return;
      }
      if (Math.abs(info.offset.x) > 5) {
        setIsDragging(true);
      }
    },
    [loop, index, length, dragX, setPauseState],
  );

  const handleDragEnd = useCallback(
    async (_: any, info: PanInfo) => {
      setIsDragging(false);
      const computedItemWidth = containerWidthMV.get();
      const swipeThreshold = computedItemWidth * 0.2;
      const velocityThreshold = 500;
      const { offset, velocity } = info;

      const canSwipeNext = loop || index < length - 1;
      const canSwipePrev = loop || index > 0;
      if (
        (offset.x < -swipeThreshold || velocity.x < -velocityThreshold) &&
        canSwipeNext
      ) {
        await finishSwipe(index + 1, 1);
      } else if (
        (offset.x > swipeThreshold || velocity.x > velocityThreshold) &&
        canSwipePrev
      ) {
        await finishSwipe(index - 1, -1);
      }
      setPauseState(false);
    },
    [
      index,
      dragX,
      finishSwipe,
      length,
      loop,
      isDragging,
      containerWidthMV,
      setPauseState,
    ],
  );

  const getItemProgress = useCallback(
    (structuralIndex: number, currentTrackX: number) => {
      const containerWidth = containerWidthMV.get();
      const computedItemWidth = containerWidth * 1;
      const itemLeftInTrack = structuralIndex * computedItemWidth;
      const itemCenterInTrack = itemLeftInTrack + computedItemWidth / 2;
      const absoluteItemCenterOnScreen = itemCenterInTrack + currentTrackX;
      const containerCenterOnScreen = containerWidth / 2;
      const distanceFromCenter = Math.abs(
        absoluteItemCenterOnScreen - containerCenterOnScreen,
      );
      const maxDistance = isMultiView ? containerWidth : containerWidth * 0.5;
      return Math.min(distanceFromCenter / maxDistance, 1);
    },
    [containerWidthMV, isMultiView],
  );

  const visibleItems = useMemo(() => {
    if (length === 0) return [];
    const result = [];
    const totalItems = loop ? cloneCount * 2 + length : length;
    for (let i = 0; i < totalItems; i++) {
      let itemIndex = loop ? (i - cloneCount) % length : i;
      if (itemIndex < 0) itemIndex += length;
      result.push({
        structuralIndex: i,
        itemIndex,
      });
    }
    return result;
  }, [length, cloneCount, variant, loop]);

  const trackX = useTransform(
    [dragX, containerWidthMV, indexMV],
    (values: number[]) => {
      const [v, width, idx] = values;
      const computedItemWidth = width * 1;
      const activeItemLeft = idx * computedItemWidth;
      const activeItemCenter = activeItemLeft + computedItemWidth / 2;
      const containerCenter = width / 2;
      return containerCenter - activeItemCenter + v;
    },
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      if (entry?.contentRect) {
        containerWidthMV.set(entry.contentRect.width);
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [containerWidthMV]);

  useEffect(() => {
    setCurrentIndex?.(virtualIndex);
  }, [setCurrentIndex]);

  useEffect(() => {
    if (!autoPlay || isPaused || length <= 1) return;
    if (!loop && index >= length - 1) return;
    const timer = setInterval(() => {
      finishSwipe(index + 1, 1);
    }, interval);
    return () => clearInterval(timer);
  }, [autoPlay, isPaused, interval, length, index, loop, finishSwipe]);

  useEffect(() => {
    if (length <= 1) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [next, prev, length]);

  return {
    index,
    containerRef,
    virtualIndex,
    isPaused,
    isNavigating,
    isDragging,
    trackX,
    next,
    prev,
    goTo,
    handleDrag,
    handleDragEnd,
    setPauseState,
    visibleItems,
    getItemProgress,
    isFirst: loop ? false : index === 0,
    isLast: loop ? false : index === length - 1,
  };
};

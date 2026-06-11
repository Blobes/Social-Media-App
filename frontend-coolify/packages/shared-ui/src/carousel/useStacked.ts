"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";

export interface CardTransforms {
  scale: number;
  translateY: string;
  translateX: string;
  zIndex: number;
  opacity: number;
  dragTransform: string;
  touchAction: "none" | "auto";
  cursor: "grabbing" | "grab" | "default";
  transition: string;
}

/**
 * Manages active indexes, autoplay intervals, and visibility layers for structural stack rendering.
 */
export const useStackedCarousel = (
  length: number,
  interval = 5000,
  autoPlay = false,
) => {
  const [currentIndex, setLocalIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const pointerStart = useRef({ x: 0, y: 0 });

  /**
   * Cycles the card deck forward to show the next item.
   */
  const next = useCallback(() => {
    if (length <= 1) return;
    setLocalIndex((prevIndex) => (prevIndex + 1) % length);
  }, [length]);

  /**
   * Cycles the card deck backward to return to the preceding item.
   */
  const prev = useCallback(() => {
    if (length <= 1) return;
    setLocalIndex((prevIndex) => (prevIndex - 1 + length) % length);
  }, [length]);

  /**
   * Jumps directly to a targeted card index within the deck.
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
    },
    [currentIndex, length],
  );

  const setPauseState = useCallback((paused: boolean) => {
    setIsPaused(paused);
  }, []);

  /**
   * Captures initial click or touch screen contact vectors.
   */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (length <= 1) return;
      setIsDragging(true);
      setPauseState(true);
      pointerStart.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [length, setPauseState],
  );

  /**
   * Calculates delta variance streams to update displacement mappings.
   */
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const deltaX = e.clientX - pointerStart.current.x;
      const deltaY = e.clientY - pointerStart.current.y;
      const progressiveY = deltaY < 0 ? deltaY * 0.95 : deltaY * 0.3;
      setDragOffset({
        x: deltaX,
        y: progressiveY,
      });
    },
    [isDragging],
  );

  /**
   * Evaluates completion thresholds to settle layout states or cycle values.
   */
  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      setIsDragging(false);
      setPauseState(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
      const threshold = 100;
      if (dragOffset.x > threshold) {
        prev();
      } else if (dragOffset.x < -threshold) {
        next();
      }
      setDragOffset({ x: 0, y: 0 });
    },
    [isDragging, dragOffset, next, prev, setPauseState],
  );

  /**
   * Computes layout properties and styling values based on current stack interaction vectors.
   */
  const getCardTransforms = useCallback(
    (depthIndex: number): CardTransforms => {
      const isTopCard = depthIndex === 0;
      const isNextCard = depthIndex === 1;

      const scale = 1 - depthIndex * 0.03;
      const translateY = `${depthIndex * -18}px`;
      const translateX = `${depthIndex * -12}px`;
      const zIndex = 10 - depthIndex;

      let opacity = 1 - depthIndex * 0.2;

      if (isNextCard && isDragging) {
        const dragThreshold = 100;
        const currentDragProgress = Math.min(
          Math.abs(dragOffset.x) / dragThreshold,
          1,
        );
        opacity = 0.8 + currentDragProgress * 0.2;
      }

      const dragTransform = isTopCard
        ? `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.05}deg)`
        : `translate(${translateX}, ${translateY}) scale(${scale})`;

      const transition =
        isDragging && isTopCard
          ? "none"
          : isDragging && isNextCard
            ? "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), z-index 0.4s step-end"
            : "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease, z-index 0.4s step-end";

      return {
        scale,
        translateY,
        translateX,
        zIndex,
        opacity,
        dragTransform,
        touchAction: isTopCard ? "none" : "auto",
        cursor: isTopCard ? (isDragging ? "grabbing" : "grab") : "default",
        transition,
      };
    },
    [isDragging, dragOffset],
  );

  /**
   * Generates rendering indexes that adapt depending on the direction of user dragging.
   */
  const visibleItems = useMemo(() => {
    if (length === 0) return [];
    const result = [];
    const visibleCount = Math.min(length, 3);
    const isDraggingRight = isDragging && dragOffset.x > 0;
    for (let i = 0; i < visibleCount; i++) {
      let itemIndex = (currentIndex + i) % length;
      if (i === 1 && isDraggingRight) {
        itemIndex = (currentIndex - 1 + length) % length;
      }
      result.push({
        itemIndex,
        depthIndex: i,
      });
    }
    return result.reverse();
  }, [currentIndex, length, isDragging, dragOffset.x]);

  useEffect(() => {
    if (!autoPlay || isPaused || isDragging || length <= 1) return;
    const timer = setInterval(() => {
      next();
    }, interval);
    return () => clearInterval(timer);
  }, [autoPlay, isPaused, isDragging, length, interval, next]);

  return {
    currentIndex,
    visibleItems,
    isPaused,
    isDragging,
    next,
    goTo,
    setPauseState,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    getCardTransforms,
  };
};

"use client";

import { useState, useCallback } from "react";

type Axis = "x" | "y";
type Direction = "ltr" | "rtl"; // Left-to-Right or Right-to-Left

interface DragConfig {
  axis: Axis;
  direction?: Direction;
  threshold?: number;
  closeAtMiddle?: boolean;
  onClose?: () => void;
}

export const useDragClose = (config: DragConfig) => {
  const [startPos, setStartPos] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  const {
    axis,
    direction,
    closeAtMiddle = false,
    threshold = 150,
    onClose,
  } = config;

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      // Save starting point based on axis
      const pos = axis === "y" ? e.touches[0].clientY : e.touches[0].clientX;
      setStartPos(pos);
    },
    [axis],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const currentPos =
        axis === "y" ? e.touches[0].clientY : e.touches[0].clientX;
      const diff = currentPos - startPos;

      if (axis === "y") {
        // Y-axis: Only allow dragging downwards (positive diff)
        if (diff > 0) setDragOffset(diff);
      } else {
        // X-axis: Check direction
        if (direction === "ltr" && diff > 0) {
          setDragOffset(diff);
        } else if (direction === "rtl" && diff < 0) {
          setDragOffset(Math.abs(diff));
        }
      }
    },
    [axis, direction, startPos],
  );

  const handleTouchEnd = useCallback(() => {
    // Determine the dynamic threshold
    let finalThreshold = threshold;
    if (axis === "x" && closeAtMiddle && typeof window !== "undefined") {
      // Trigger close if dragged past 45% of the screen width
      finalThreshold = window.innerWidth * 0.35;
    }
    if (dragOffset > finalThreshold) {
      if (onClose) onClose();
    }
    setDragOffset(0);
  }, [dragOffset, threshold, onClose, axis, closeAtMiddle]);

  return {
    axis,
    dragOffset,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
};

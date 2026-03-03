"use client";

import { IDragConfig, IDragResult } from "@repo/types";
import { useState, useCallback } from "react";

export const useDragClose = (config: IDragConfig): IDragResult => {
  const [startPos, setStartPos] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  const { axis, dragOrigin, closeAtMiddle = false, threshold = 150 } = config;

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      // Save starting point based on axis
      const pos = axis === "Y" ? e.touches[0].clientY : e.touches[0].clientX;
      setStartPos(pos);
    },
    [axis],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const currentPos =
        axis === "Y" ? e.touches[0].clientY : e.touches[0].clientX;
      const diff = currentPos - startPos;

      if (axis === "Y") {
        // Y-axis: Only allow dragging downwards (positive diff)
        if (diff > 0) setDragOffset(diff);
      } else {
        // X-axis: Check direction
        if (dragOrigin === "ltr" && diff > 0) {
          setDragOffset(diff);
        } else if (dragOrigin === "rtl" && diff < 0) {
          setDragOffset(Math.abs(diff));
        }
      }
    },
    [axis, dragOrigin, startPos],
  );

  const handleTouchEnd = useCallback(
    (onDragEnd?: () => void) => {
      // Determine the dynamic threshold
      let finalThreshold = threshold;
      if (axis === "X" && closeAtMiddle && typeof window !== "undefined") {
        // Trigger close if dragged past 45% of the screen width
        finalThreshold = window.innerWidth * 0.35;
      }
      if (dragOffset > finalThreshold) {
        if (onDragEnd) onDragEnd();
      }
      setDragOffset(0);
    },
    [dragOffset, threshold, axis, closeAtMiddle],
  );

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

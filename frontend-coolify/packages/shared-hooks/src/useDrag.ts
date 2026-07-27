"use client";

import { useState, useCallback, useRef } from "react";
import {
  Direction,
  IDragConfig,
  IDragResult,
  ElementPosition,
} from "@repo/core";

/**
 * Handles element drag positioning and touch swipe closure mechanics.
 */
export const useDrag = (config: IDragConfig = {}): IDragResult => {
  const [startPos, setStartPos] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const activeItemIdRef = useRef<string | null>(null);

  const {
    axis = "X",
    dragOrigin,
    closeAtMiddle = false,
    threshold = 150,
    containerRef,
    onPositionChange,
  } = config;

  /**
   * Normalizes configuration object for swipe directional bindings.
   */
  const resolveDragConfig = useCallback(
    (dir: Direction = "left"): IDragConfig => {
      const resolvedAxis =
        config?.axis || (dir === "up" || dir === "down" ? "Y" : "X");
      const resolvedDragOrigin =
        config?.dragOrigin ||
        (dir === "left" ? "LTR" : dir === "right" ? "RTL" : undefined);
      const resolvedCloseAtMiddle = config?.closeAtMiddle ?? false;
      const resolvedThreshold = config?.threshold || 60;

      return {
        axis: resolvedAxis,
        dragOrigin: resolvedDragOrigin,
        closeAtMiddle: resolvedCloseAtMiddle,
        threshold: resolvedThreshold,
      };
    },
    [],
  );

  /**
   * Tracks touch initialization for swipe-to-close events.
   */
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const pos = axis === "Y" ? e.touches[0].clientY : e.touches[0].clientX;
      setStartPos(pos);
    },
    [axis],
  );

  /**
   * Calculates movement offset for touch swipes.
   */
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const currentPos =
        axis === "Y" ? e.touches[0].clientY : e.touches[0].clientX;
      const diff = currentPos - startPos;

      if (axis === "Y") {
        if (diff > 0) setDragOffset(diff);
      } else {
        if (dragOrigin === "LTR" && diff > 0) {
          setDragOffset(diff);
        } else if (dragOrigin === "RTL" && diff < 0) {
          setDragOffset(Math.abs(diff));
        }
      }
    },
    [axis, dragOrigin, startPos],
  );

  /**
   * Evaluates swipe displacement against threshold limits.
   */
  const handleTouchEnd = useCallback(
    (onDragEnd?: () => void) => {
      let finalThreshold = threshold;
      if (axis === "X" && closeAtMiddle && typeof window !== "undefined") {
        finalThreshold = window.innerWidth * 0.35;
      }
      if (dragOffset > finalThreshold) {
        if (onDragEnd) onDragEnd();
      }
      setDragOffset(0);
    },
    [dragOffset, threshold, axis, closeAtMiddle],
  );

  /**
   * Calculates mouse cursor displacement relative to bounding container dimensions.
   */
  const handleElementDragStart = useCallback(
    (
      e: React.MouseEvent<HTMLDivElement>,
      itemId: string,
      onFocus?: (id: string) => void,
    ) => {
      e.stopPropagation();
      activeItemIdRef.current = itemId;
      onFocus?.(itemId);

      if (!containerRef?.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      /**
       * Updates drag position calculations on mouse movement.
       */
      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!activeItemIdRef.current) return;

        const x = ((moveEvent.clientX - rect.left) / rect.width) * 100;
        const y = ((moveEvent.clientY - rect.top) / rect.height) * 100;

        const clampedPosition: ElementPosition = {
          x: Math.max(0, Math.min(100, x)),
          y: Math.max(0, Math.min(100, y)),
        };

        onPositionChange?.(clampedPosition);
      };

      /**
       * Cleans up mouse listeners on pointer release.
       */
      const handleMouseUp = () => {
        activeItemIdRef.current = null;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [containerRef, onPositionChange],
  );

  return {
    axis,
    dragOffset,
    resolveDragConfig,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onElementDragStart: handleElementDragStart,
    },
  };
};

"use client";

import { useMemo, useCallback } from "react";

export interface UseContentResizerOptions {
  startValue?: number;
  increaseBy?: number;
  barsCount?: number;
  currentValue?: number;
  onResizeChange?: (value: number) => void;
}

export interface ResizerBarItem {
  index: number;
  value: number;
  width: number;
  isActive: boolean;
}

/**
 * Generates bar values and width proportions for content resizing interactions.
 */
export const useContentResizer = ({
  startValue = 10,
  increaseBy = 5,
  barsCount = 5,
  currentValue,
  onResizeChange,
}: UseContentResizerOptions = {}) => {
  const safeStart = Math.max(0, startValue);
  const safeIncrease = Math.max(0, increaseBy);
  const safeCount = Math.max(1, barsCount);

  const bars = useMemo<ResizerBarItem[]>(() => {
    const items: ResizerBarItem[] = [];
    let accum = safeStart;

    for (let i = 0; i < safeCount; i++) {
      accum = i === 0 ? safeStart + safeIncrease : accum + safeIncrease;
      const val = accum;
      items.push({
        index: i,
        value: val,
        width: 16 + i * 8,
        isActive: currentValue === val,
      });
    }

    return items;
  }, [safeStart, safeIncrease, safeCount, currentValue]);

  /**
   * Dispatches resize handler when a bar is clicked.
   */
  const handleBarSelect = useCallback(
    (value: number) => {
      onResizeChange?.(value);
    },
    [onResizeChange],
  );

  return {
    bars,
    handleBarSelect,
  };
};

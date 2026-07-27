"use client";

import { useCallback } from "react";
import { ImageFilterType } from "@repo/core";

export interface UseFilterModeOptions {
  activeFilter?: ImageFilterType;
  onFilterChange?: (filter: ImageFilterType) => void;
}

export const FILTER_LIST: {
  type: ImageFilterType;
  label: string;
  filterStyle: string;
}[] = [
  { type: "ORIGINAL", label: "Original", filterStyle: "none" },
  {
    type: "CLARENDON",
    label: "Clarendon",
    filterStyle: "contrast(1.2) saturate(1.25)",
  },
  {
    type: "GINGHAM",
    label: "Gingham",
    filterStyle: "brightness(1.05) hue-rotate(-10deg)",
  },
  { type: "MOON", label: "Moon", filterStyle: "grayscale(1) contrast(1.1)" },
  { type: "LARK", label: "Lark", filterStyle: "contrast(0.9) brightness(1.1)" },
  {
    type: "REYES",
    label: "Reyes",
    filterStyle: "sepia(0.22) brightness(1.1) contrast(0.85)",
  },
  { type: "JUNO", label: "Juno", filterStyle: "contrast(1.15) saturate(1.4)" },
  {
    type: "SLUMBER",
    label: "Slumber",
    filterStyle: "saturate(0.66) brightness(1.05)",
  },
];

/**
 * Controls active CSS photo filter selections and styles.
 */
export const useFilterMode = ({
  activeFilter = "ORIGINAL",
  onFilterChange,
}: UseFilterModeOptions = {}) => {
  /**
   * Applies selected filter preset.
   */
  const handleSelectFilter = useCallback(
    (filter: ImageFilterType) => {
      onFilterChange?.(filter);
    },
    [onFilterChange],
  );

  /**
   * Resolves CSS filter value string for active mode.
   */
  const getFilterStyle = useCallback((filter: ImageFilterType) => {
    const item = FILTER_LIST.find((f) => f.type === filter);
    return item ? item.filterStyle : "none";
  }, []);

  return {
    activeFilter,
    FILTER_LIST,
    handleSelectFilter,
    getFilterStyle,
  };
};

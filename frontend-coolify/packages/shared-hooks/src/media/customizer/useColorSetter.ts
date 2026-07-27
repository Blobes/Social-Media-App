"use client";

import { useCallback, useMemo } from "react";
import { ColorConfig, ColorType } from "@repo/core";

export interface UseColorSetterOptions {
  activeColorType?: ColorType;
  onColorChange?: (colorType: ColorType) => void;
}

export const COLOR_CONFIGS: Record<ColorType, ColorConfig> = {
  CLEAR_LIGHT: {
    name: "Clear Light",
    backgroundColor: "transparent",
    color: "#FFFFFF",
  },
  TRANSLUCENT_LIGHT: {
    name: "Translucent Light",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    color: "#000000",
  },
  TRANSLUCENT_DARK: {
    name: "Translucent Dark",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    color: "#FFFFFF",
  },
  SOLID_LIGHT: {
    name: "Solid Light",
    backgroundColor: "#FFFFFF",
    color: "#000000",
  },
  SOLID_DARK: {
    name: "Solid Dark",
    backgroundColor: "#000000",
    color: "#FFFFFF",
  },
  BRIGHT_RED: {
    name: "Bright Red",
    backgroundColor: "#FFBDBD",
    color: "#B42626",
  },
  BRIGHT_BLUE: {
    name: "Bright Blue",
    backgroundColor: "#9EBFFF",
    color: "#1D3DB3",
  },
  BRIGHT_YELLOW: {
    name: "Bright Yellow",
    backgroundColor: "#FFF09E",
    color: "#98711B",
  },
  BRIGHT_GREEN: {
    name: "Bright Green",
    backgroundColor: "#9EFFA6",
    color: "#14791B",
  },
  BRIGHT_PINK: {
    name: "Bright Pink",
    backgroundColor: "#FAC3FF",
    color: "#C2229C",
  },
  BRIGHT_ORANGE: {
    name: "Bright Orange",
    backgroundColor: "#FFC7A7",
    color: "#B66515",
  },
  BRIGHT_PURPLE: {
    name: "Bright Orange",
    backgroundColor: "#6315B6",
    color: "#DEB0FF",
  },
};

const COLOR_ORDER: ColorType[] = [
  "CLEAR_LIGHT",
  "TRANSLUCENT_LIGHT",
  "TRANSLUCENT_DARK",
  "SOLID_LIGHT",
  "SOLID_DARK",
  "BRIGHT_RED",
  "BRIGHT_BLUE",
  "BRIGHT_YELLOW",
  "BRIGHT_GREEN",
  "BRIGHT_PINK",
  "BRIGHT_ORANGE",
  "BRIGHT_PURPLE",
];

/**
 * Manages color state cycling and style object generation for customizable text overlays.
 */
export const useColorSetter = ({
  activeColorType = "CLEAR_LIGHT",
  onColorChange,
}: UseColorSetterOptions = {}) => {
  const activeConfig = useMemo(
    () => COLOR_CONFIGS[activeColorType] || COLOR_CONFIGS.CLEAR_LIGHT,
    [activeColorType],
  );

  /**
   * Cycles to the next available color scheme sequentially.
   */
  const toggleNextColor = useCallback(() => {
    const currentIndex = COLOR_ORDER.indexOf(activeColorType);
    const nextIndex = (currentIndex + 1) % COLOR_ORDER.length;
    const nextType = COLOR_ORDER[nextIndex];
    onColorChange?.(nextType);
  }, [activeColorType, onColorChange]);

  return {
    activeColorType,
    activeConfig,
    toggleNextColor,
  };
};

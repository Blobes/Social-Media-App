"use client";

import { zIndexes, rotate } from "@repo/helpers";

interface AnimateBorder {
  borderWidth?: number;
  duration?: string;
  borderColor?: string;
}

export const useAnimation = () => {
  const animateBorder = ({
    borderWidth = 1,
    duration = "10s",
    borderColor,
  }: AnimateBorder) => {
    return {
      position: "relative",
      overflow: "hidden",
      "&::before": {
        content: '""',
        position: "absolute",
        left: "-25%",
        top: "-25%",
        width: "150%",
        height: "150%",
        background: `conic-gradient(transparent, ${borderColor}, transparent 60%)`,
        animation: `${rotate} ${duration} linear infinite`,
        zIndex: zIndexes.negative,
        filter: "blur(8px)",
      },
      "&::after": {
        content: '""',
        position: "absolute",
        inset: borderWidth,
        backgroundColor: "inherit",
        borderRadius: `inherit`,
        zIndex: zIndexes.negative,
      },
    };
  };

  return { animateBorder };
};

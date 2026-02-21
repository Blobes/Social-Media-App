"use client";

import { useEffect, useState } from "react";

export const usePageScroll = () => {
  const handlePageScroll = (ref?: React.RefObject<HTMLElement | null>) => {
    const [scrollDir, setScrollDir] = useState<"up" | "down">("up");
    const [prevOffset, setPrevOffset] = useState(0);

    useEffect(() => {
      const scrollTarget = ref?.current || window;

      const scroll = () => {
        const currentOffset =
          scrollTarget instanceof Window
            ? window.scrollY
            : scrollTarget.scrollTop;

        // 1. Determine direction
        const direction = currentOffset > prevOffset ? "down" : "up";

        // 2. Optimization: Only update state if direction changed
        // and we've scrolled more than a small threshold (e.g. 10px)
        if (
          direction !== scrollDir &&
          Math.abs(currentOffset - prevOffset) > 16
        ) {
          setScrollDir(direction);
        }
        setPrevOffset(currentOffset);
      };

      scrollTarget.addEventListener("scroll", scroll);
      return () => scrollTarget.removeEventListener("scroll", scroll);
    }, [scrollDir, prevOffset]);

    return scrollDir;
  };

  return {
    handlePageScroll,
  };
};

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useIntersectionObserver } from "./useObserver";

/**
 * Optimized hook for tracking scroll direction.
 * Uses a threshold and throttle to prevent main-thread blocking.
 */
export const usePageScroll = () => {
  /**
   * Tracks scroll direction on a target element or window.
   */
  const handlePageScroll = (ref?: React.RefObject<HTMLElement | null>) => {
    const [scrollDir, setScrollDir] = useState<"up" | "down">("up");

    // We use a ref for the offset to avoid re-rendering on every single pixel move
    const prevOffset = useRef(0);
    const ticking = useRef(false);

    useEffect(() => {
      const scrollTarget = ref?.current || window;

      const updateScrollDir = () => {
        const currentOffset =
          scrollTarget instanceof Window
            ? window.scrollY
            : scrollTarget.scrollTop;

        const diff = currentOffset - prevOffset.current;

        // 1. Logic: Check direction and apply threshold (16px)
        // Only update state if direction changed and threshold is met
        if (Math.abs(diff) > 16) {
          const newDir = diff > 0 ? "down" : "up";

          if (newDir !== scrollDir) {
            setScrollDir(newDir);
          }

          // Update ref value without triggering a render
          prevOffset.current = currentOffset <= 0 ? 0 : currentOffset;
        }

        ticking.current = false;
      };

      const onScroll = () => {
        if (!ticking.current) {
          window.requestAnimationFrame(updateScrollDir);
          ticking.current = true;
        }
      };

      scrollTarget.addEventListener("scroll", onScroll, { passive: true });
      return () => scrollTarget.removeEventListener("scroll", onScroll);
    }, [scrollDir, ref]); // Only re-bind if the target or direction changes

    return scrollDir;
  };

  return {
    handlePageScroll,
  };
};

interface InfiniteScrollOptions {
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}
/**
 * Triggers fetchNextPage when the sentinel enters the viewport.
 */
export const useInfiniteScroll = ({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: InfiniteScrollOptions) => {
  const { elementRef } = useIntersectionObserver({
    onIntersect: fetchNextPage,
    threshold: 0.1,
    rootMargin: "200px",
    enabled: !!hasNextPage && !isFetchingNextPage,
    once: false, // Keep observing for subsequent pages
  });

  return { sentinelRef: elementRef };
};

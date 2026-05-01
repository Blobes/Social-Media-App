"use client";

import { useEffect, useRef, useCallback } from "react";

interface ObserverOptions {
  onIntersect: () => void;
  onLeave?: () => void; // Added to handle exit events
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
  once?: boolean;
}

/**
 * A generic hook to observe an element's intersection with the viewport.
 */
export const useIntersectionObserver = ({
  onIntersect,
  onLeave,
  threshold = 0.1,
  rootMargin = "0px",
  enabled = true,
  once = false,
}: ObserverOptions) => {
  const elementRef = useRef<HTMLElement | null>(null);

  const internalCallback = useCallback(
    (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
      const [entry] = entries;

      if (entry.isIntersecting && enabled) {
        onIntersect();
        // If "once" is true and there's no leave logic, stop observing immediately
        if (once && !onLeave && elementRef.current) {
          observer.unobserve(elementRef.current);
        }
      } else if (!entry.isIntersecting && onLeave) {
        onLeave();
      }
    },
    [onIntersect, onLeave, enabled, once],
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

    const observer = new IntersectionObserver(internalCallback, {
      threshold,
      rootMargin,
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [internalCallback, threshold, rootMargin, enabled]);

  return { elementRef };
};

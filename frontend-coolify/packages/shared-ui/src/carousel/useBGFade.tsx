import { Box } from "@mui/material";
import { IBGFadeSlideData } from "@repo/core";
import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Handles state transitions, index mapping, and automated playback timing for crossfade carousel models.
 */
export const useBGFadeCarousel = (
  length: number,
  interval = 5000,
  autoPlay = true,
  initialIndex = 0,
  onIndexChange?: (index: number) => void,
) => {
  const safeInitialIndex =
    length > 0 ? Math.min(Math.max(initialIndex, 0), length - 1) : 0;

  const [currentIndex, setCurrentIndex] = useState(safeInitialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Forces state parameters to map safely to a designated step target index.
   */
  const goTo = useCallback(
    (targetIndex: number) => {
      if (targetIndex < 0 || targetIndex >= length) return;
      setCurrentIndex(targetIndex);
      onIndexChange?.(targetIndex);
    },
    [length, onIndexChange],
  );

  /**
   * Transitions to the next index in sequence with circular overflow handling.
   */
  const next = useCallback(() => {
    const nextIndex = (currentIndex + 1) % length;
    goTo(nextIndex);
  }, [currentIndex, length, goTo]);

  /**
   * Transitions to the previous index in sequence with circular overflow handling.
   */
  const prev = useCallback(() => {
    const prevIndex = (currentIndex - 1 + length) % length;
    goTo(prevIndex);
  }, [currentIndex, length, goTo]);

  /**
   * Suspends or resumes the automatic slide transition timeline.
   */
  const setPauseState = useCallback((paused: boolean) => {
    setIsPaused(paused);
  }, []);

  /**
   * Evaluates polymorphic media payloads to output correct background markup layers.
   */
  const renderMediaAsset = (slide: IBGFadeSlideData, isSelected: boolean) => {
    const url = slide.media.url;
    const assetStyles = {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover" as const,
      opacity: isSelected ? 1 : 0,
      transition: "opacity 1s cubic-bezier(0.4, 0, 0.2, 1)",
      border: "none",
    };

    if (slide.media.type === "VIDEO") {
      return (
        <Box
          component="video"
          key={`bg-video-${slide.media._id}`}
          src={url}
          autoPlay
          loop
          muted
          playsInline
          sx={assetStyles}
        />
      );
    }
    return (
      <Box
        key={`bg-image-${slide.media._id}`}
        sx={{
          ...assetStyles,
          backgroundImage: `url(${url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    );
  };

  useEffect(() => {
    if (!autoPlay || isPaused || length <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      next();
    }, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoPlay, isPaused, currentIndex, length, interval, next]);

  return {
    currentIndex,
    isPaused,
    next,
    prev,
    goTo,
    setPauseState,
    isFirst: currentIndex === 0,
    isLast: currentIndex === length - 1,
    renderMediaAsset,
  };
};

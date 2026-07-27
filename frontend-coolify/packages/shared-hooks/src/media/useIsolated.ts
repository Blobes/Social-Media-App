"use client";

import { useState, useCallback } from "react";
import { IMedia } from "@repo/core";

interface UseIsolatedProps {
  mediaList: IMedia[];
  onDoubleTap?: () => void;
  initialIndex?: number;
  onBackClick?: () => void;
}

export const useIsolatedMedia = ({
  mediaList,
  onDoubleTap,
  initialIndex = 0,
  onBackClick,
}: UseIsolatedProps) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [activeMedia, setActiveMedia] = useState<IMedia | null>(
    mediaList?.[initialIndex] || null,
  );

  const [hideInfo, setHideInfo] = useState(false);

  const handleSingleTap = useCallback(() => {
    setHideInfo((prev) => !prev);
  }, []);

  const handleDoubleTap = useCallback(() => {
    onDoubleTap?.();
  }, [onDoubleTap]);

  const handleSetCurrentIndex = useCallback(
    (index: number) => {
      setActiveIndex(index);
      const newMedia = mediaList[index];
      if (newMedia) {
        setActiveMedia(newMedia);
      }
    },
    [mediaList],
  );

  const handleBackClick = () => {
    if (onBackClick) onBackClick();
    /* Navigation logic */
  };
  const handleMoreClick = () => {
    /* Menu logic */
  };

  return {
    activeIndex,
    activeMedia,
    hideInfo,
    handleSingleTap,
    handleDoubleTap,
    handleSetCurrentIndex,
    handleBackClick,
    handleMoreClick,
  };
};

"use client";

import { useState, useCallback } from "react";
import {
  CustomizedMedia,
  CustomizerMode,
  IMedia,
  ImageFilterType,
  StickerOnMedia,
  TextOnMedia,
} from "@repo/core";

export interface UseMediaCustomizerOptions {
  media: IMedia;
  onSave?: (customizedMedia: CustomizedMedia) => void;
}

/**
 * Top-level state coordinator managing view mode toggles, overlays, and save payloads.
 */
export const useMediaCustomizer = ({
  media,
  onSave,
}: UseMediaCustomizerOptions) => {
  const [activeMode, setActiveMode] = useState<CustomizerMode>("TEXT");
  const [isPreview, setIsPreview] = useState(false);

  const [textsOnMedia, setTextsOnMedia] = useState<TextOnMedia[]>(
    media.customizations?.textsOnMedia || [],
  );
  const [filter, setFilter] = useState<ImageFilterType>(
    media.customizations?.filter || "ORIGINAL",
  );
  const [stickersOnMedia, setStickersOnMedia] = useState<StickerOnMedia[]>(
    media.customizations?.stickersOnMedia || [],
  );

  const [focusedTextId, setFocusedTextId] = useState<string | null>(null);
  const [focusedStickerId, setFocusedStickerId] = useState<string | null>(null);

  /**
   * Switches active editor tab mode.
   */
  const handleModeChange = useCallback((mode: CustomizerMode) => {
    setActiveMode(mode);
    setFocusedTextId(null);
    setFocusedStickerId(null);
  }, []);

  /**
   * Toggles full-canvas preview overlay mode.
   */
  const togglePreview = useCallback(() => {
    setIsPreview((prev) => !prev);
  }, []);

  /**
   * Compiles customized state parameters and triggers parent save delegate.
   */
  const handleSave = useCallback(() => {
    const payload: CustomizedMedia = {
      textsOnMedia,
      filter,
      stickersOnMedia,
    };
    onSave?.(payload);
  }, [textsOnMedia, filter, stickersOnMedia, onSave]);

  return {
    activeMode,
    isPreview,
    textsOnMedia,
    filter,
    stickersOnMedia,
    focusedTextId,
    focusedStickerId,
    setTextsOnMedia,
    setFilter,
    setStickersOnMedia,
    setFocusedTextId,
    setFocusedStickerId,
    handleModeChange,
    togglePreview,
    handleSave,
  };
};

"use client";

import { useState, useCallback, useMemo } from "react";
import { ElementPosition, StickerItem, StickerOnMedia } from "@repo/core";

export interface UseStickerModeOptions {
  stickers?: StickerOnMedia[];
  onStickersChange?: (stickers: StickerOnMedia[]) => void;
  onFocusSticker?: (id: string | null) => void;
}

export type StickerTab = "STICKER" | "EMOJI";

export const MOCK_STICKERS: StickerItem[] = Array.from(
  { length: 24 },
  (_, i) => ({
    id: `stk_${i + 1}`,
    content: i % 2 === 0 ? "🔥" : "⭐",
    category: i < 12 ? "STICKER" : "EMOJI",
  }),
);

/**
 * Handles sticker tray state, multi-selection modals, and canvas positioning.
 */
export const useStickerMode = ({
  stickers = [],
  onStickersChange,
  onFocusSticker,
}: UseStickerModeOptions = {}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState<StickerTab>("STICKER");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<string[]>([]);
  const [focusedStickerId, setFocusedStickerId] = useState<string | null>(null);

  const filteredLibrary = useMemo(() => {
    return MOCK_STICKERS.filter((item) => {
      const matchesCategory = item.category === activeTab;
      const matchesSearch = item.content
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  /**
   * Directly places a single sticker onto the canvas from minimized view.
   */
  const handleAddSingleSticker = useCallback(
    (item: StickerItem) => {
      const newSticker: StickerOnMedia = {
        id: `sticker_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        content: item.content,
        position: { x: 40, y: 40 },
        size: 60,
      };
      onStickersChange?.([...stickers, newSticker]);
    },
    [stickers, onStickersChange],
  );

  /**
   * Toggles selection state of stickers inside maximized modal view.
   */
  const handleToggleLibrarySelect = useCallback((id: string) => {
    setSelectedLibraryIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }, []);

  /**
   * Clears selection inside maximized tray.
   */
  const handleUnselectAll = useCallback(() => {
    setSelectedLibraryIds([]);
  }, []);

  /**
   * Confirms batch selected items from maximized modal onto canvas.
   */
  const handleBatchAddSelected = useCallback(() => {
    const selectedItems = MOCK_STICKERS.filter((item) =>
      selectedLibraryIds.includes(item.id),
    );
    const newStickers: StickerOnMedia[] = selectedItems.map((item, idx) => ({
      id: `sticker_${Date.now()}_${idx}`,
      content: item.content,
      position: { x: 30 + idx * 10, y: 30 + idx * 10 },
      size: 60,
    }));

    onStickersChange?.([...stickers, ...newStickers]);
    setSelectedLibraryIds([]);
    setIsMaximized(false);
  }, [selectedLibraryIds, stickers, onStickersChange]);

  /**
   * Focuses target sticker on canvas.
   */
  const handleFocus = useCallback(
    (id: string) => {
      setFocusedStickerId(id);
      onFocusSticker?.(id);
    },
    [onFocusSticker],
  );

  /**
   * Updates target sticker size on canvas.
   */
  const handleSizeChange = useCallback(
    (id: string, size: number) => {
      const updated = stickers.map((s) => (s.id === id ? { ...s, size } : s));
      onStickersChange?.(updated);
    },
    [stickers, onStickersChange],
  );

  /**
   * Updates position coordinates for a dragged sticker item.
   */
  const handlePositionChange = useCallback(
    (id: string, position: ElementPosition) => {
      const updated = stickers.map((s) =>
        s.id === id ? { ...s, position } : s,
      );
      onStickersChange?.(updated);
    },
    [stickers, onStickersChange],
  );

  /**
   * Deletes sticker element from canvas.
   */
  const handleRemoveSticker = useCallback(
    (id: string) => {
      const updated = stickers.filter((s) => s.id !== id);
      if (focusedStickerId === id) {
        setFocusedStickerId(null);
        onFocusSticker?.(null);
      }
      onStickersChange?.(updated);
    },
    [stickers, focusedStickerId, onStickersChange, onFocusSticker],
  );

  return {
    isMaximized,
    setIsMaximized,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedLibraryIds,
    filteredLibrary,
    focusedStickerId,
    handleAddSingleSticker,
    handleToggleLibrarySelect,
    handleUnselectAll,
    handleBatchAddSelected,
    handleFocus,
    handleSizeChange,
    handlePositionChange,
    handleRemoveSticker,
  };
};

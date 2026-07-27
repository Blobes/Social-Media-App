"use client";

import { useState, useCallback, useRef } from "react";
import {
  ColorType,
  FontType,
  ElementPosition,
  TextOnMedia,
  TextAlignment,
} from "@repo/core";
import { useDrag } from "../../useDrag";

export interface UseTextModeOptions {
  texts?: TextOnMedia[];
  onTextsChange?: (texts: TextOnMedia[]) => void;
  onFocusText?: (id: string | null) => void;
}

export const FONT_TYPES: FontType[] = [
  "sans-serif",
  "serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "cursive-bold",
];

/**
 * Manages text node additions, deletions, font selection, alignment, and position updates.
 */
export const useTextMode = ({
  texts = [],
  onTextsChange,
  onFocusText,
}: UseTextModeOptions = {}) => {
  const [activeFont, setActiveFont] = useState<FontType>(FONT_TYPES[0]);
  const [focusedTextId, setFocusedTextId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeDragIdRef = useRef<string | null>(null);

  /**
   * Updates position coordinates for a dragged text item.
   */
  const handlePositionChange = useCallback(
    (position: ElementPosition) => {
      if (!activeDragIdRef.current) return;
      const targetId = activeDragIdRef.current;
      const updated = texts.map((t) =>
        t.id === targetId ? { ...t, position } : t,
      );
      onTextsChange?.(updated);
    },
    [texts, onTextsChange],
  );

  const { handlers } = useDrag({
    containerRef,
    onPositionChange: handlePositionChange,
  });

  /**
   * Adds new text element or updates active font on currently focused element.
   */
  const handleSelectFont = useCallback(
    (font: FontType) => {
      setActiveFont(font);

      if (focusedTextId) {
        const updated = texts.map((t) =>
          t.id === focusedTextId ? { ...t, fontType: font } : t,
        );
        onTextsChange?.(updated);
        return;
      }

      const newId = `text_${Date.now()}`;
      const newText: TextOnMedia = {
        id: newId,
        content: "",
        position: { x: 30, y: 30 },
        fontType: font,
        colorType: "SOLID_LIGHT",
        size: 24,
        textAlign: "center",
      };

      onTextsChange?.([...texts, newText]);
      setFocusedTextId(newId);
      onFocusText?.(newId);
    },
    [focusedTextId, texts, onTextsChange, onFocusText],
  );

  /**
   * Focuses targeted text item and syncs current font type.
   */
  const handleFocus = useCallback(
    (id: string) => {
      setFocusedTextId(id);
      onFocusText?.(id);
      const target = texts.find((t) => t.id === id);
      if (target) {
        setActiveFont(target.fontType);
      }
    },
    [texts, onFocusText],
  );

  /**
   * Clears currently focused text selection.
   */
  const handleBlurAll = useCallback(() => {
    setFocusedTextId(null);
    onFocusText?.(null);
  }, [onFocusText]);

  /**
   * Updates content text for a specified text item ID.
   */
  const handleContentChange = useCallback(
    (id: string, content: string) => {
      const updated = texts.map((t) => (t.id === id ? { ...t, content } : t));
      onTextsChange?.(updated);
    },
    [texts, onTextsChange],
  );

  /**
   * Updates color preset on the specified text item.
   */
  const handleColorChange = useCallback(
    (id: string, colorType: ColorType) => {
      const updated = texts.map((t) => (t.id === id ? { ...t, colorType } : t));
      onTextsChange?.(updated);
    },
    [texts, onTextsChange],
  );

  /**
   * Updates font size on the specified text item.
   */
  const handleSizeChange = useCallback(
    (id: string, size: number) => {
      const updated = texts.map((t) => (t.id === id ? { ...t, size } : t));
      onTextsChange?.(updated);
    },
    [texts, onTextsChange],
  );

  /**
   * Updates text alignment for a specified text item.
   */
  const handleTextAlignChange = useCallback(
    (id: string, textAlign: TextAlignment) => {
      const updated = texts.map((t) => (t.id === id ? { ...t, textAlign } : t));
      onTextsChange?.(updated);
    },
    [texts, onTextsChange],
  );

  /**
   * Initiates drag sequence via generic drag handler.
   */
  const handleDragStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, itemId: string) => {
      activeDragIdRef.current = itemId;
      handlers.onElementDragStart(e, itemId, handleFocus);
    },
    [handlers, handleFocus],
  );

  /**
   * Removes text item from collection by ID.
   */
  const handleRemoveText = useCallback(
    (id: string) => {
      const updated = texts.filter((t) => t.id !== id);
      if (focusedTextId === id) {
        setFocusedTextId(null);
        onFocusText?.(null);
      }
      onTextsChange?.(updated);
    },
    [texts, focusedTextId, onTextsChange, onFocusText],
  );

  return {
    activeFont,
    focusedTextId,
    containerRef,
    handleSelectFont,
    handleFocus,
    handleBlurAll,
    handleContentChange,
    handleColorChange,
    handleSizeChange,
    handleTextAlignChange,
    handlePositionChange,
    handleDragStart,
    handleRemoveText,
  };
};

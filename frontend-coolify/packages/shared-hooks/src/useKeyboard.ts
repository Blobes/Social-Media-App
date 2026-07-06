"use client";

import React, { useState, useEffect } from "react";
import { useGlobalStore } from "@repo/core";
import { getBrowserLanguage } from "@repo/helpers";

/**
 * Custom hook to abstract keyboard visibility toggle and selection insertion logic across distinct field inputs.
 */
export const useVirtualKeyboard = (
  elementRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  onChange?: (event: any) => void,
) => {
  const currentLanguage = useGlobalStore((state) => state.currentLanguage);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [useVirtualKeyboard, setUseVirtualKeyboard] = useState(false);

  useEffect(() => {
    const languagesRequiringVirtualKeyboard = ["ar", "ru"];
    const needsVirtualLayout = languagesRequiringVirtualKeyboard.includes(
      currentLanguage || "",
    );

    // const FORCE_KEYBOARD_TESTING = true;
    // if (FORCE_KEYBOARD_TESTING) {
    //   setUseVirtualKeyboard(true);
    //   setShowKeyboard(true);
    //   return;
    // }

    if (needsVirtualLayout) {
      // Evaluate if the active app language matches the primary detected browser locale layout
      const browserLang = getBrowserLanguage();
      const systemMatchesLanguage = browserLang === currentLanguage;

      setUseVirtualKeyboard(!systemMatchesLanguage);
    } else {
      setUseVirtualKeyboard(false);
      setShowKeyboard(false);
    }
  }, [currentLanguage]);

  const handleKeyInsert = (char: string) => {
    if (!elementRef.current) return;
    const input = elementRef.current;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const currentVal = input.value;

    const nextVal =
      currentVal.substring(0, start) + char + currentVal.substring(end);

    if (onChange) onChange({ target: { ...input, value: nextVal } });

    window.requestAnimationFrame(() => {
      input.setSelectionRange(start + char.length, start + char.length);
      input.focus();
    });
  };

  const handleBackspace = () => {
    if (!elementRef.current) return;
    const input = elementRef.current;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const currentVal = input.value;

    if (start === 0 && end === 0) return;

    let nextVal = "";
    let nextCursor = start;

    if (start === end) {
      nextVal =
        currentVal.substring(0, start - 1) + currentVal.substring(start);
      nextCursor = start - 1;
    } else {
      nextVal = currentVal.substring(0, start) + currentVal.substring(end);
      nextCursor = start;
    }

    if (onChange) onChange({ target: { ...input, value: nextVal } });

    window.requestAnimationFrame(() => {
      input.setSelectionRange(nextCursor, nextCursor);
      input.focus();
    });
  };

  const handleSpace = () => handleKeyInsert(" ");

  return {
    showKeyboard,
    setShowKeyboard,
    useVirtualKeyboard,
    handleKeyInsert,
    handleBackspace,
    handleSpace,
  };
};

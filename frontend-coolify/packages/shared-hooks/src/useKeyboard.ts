"use client";

import React, { useEffect } from "react";
import { useGlobalStore } from "@repo/core";

/**
 * Custom hook to abstract keyboard visibility toggle and selection insertion logic across distinct field inputs.
 */
export const useVirtualKeyboard = (
  elementRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  onChange?: (event: any) => void,
  fieldType: "text" | "tel" | "number" | "phone-formatted" = "text",
) => {
  const currentLanguage = useGlobalStore((state) => state.currentLanguage);
  const isKeyboardVisible = useGlobalStore((state) => state.isKeyboardVisible);
  const setKeyboardVisible = useGlobalStore(
    (state) => state.setKeyboardVisible,
  );
  const setActiveInput = useGlobalStore((state) => state.setActiveInput);

  const globalElementRef = useGlobalStore((state) => state.activeInputRef);
  const globalOnChange = useGlobalStore((state) => state.activeOnChange);
  const globalFieldType = useGlobalStore((state) => state.activeFieldType);

  const useVirtualKeyboard = ["ar", "ru", "zh", "ja"].includes(
    currentLanguage || "",
  );

  useEffect(() => {
    if (!useVirtualKeyboard) {
      setKeyboardVisible(false);
      setActiveInput(null, null, null);
    }
  }, [currentLanguage, useVirtualKeyboard, setKeyboardVisible, setActiveInput]);

  useEffect(() => {
    if (!useVirtualKeyboard || !isKeyboardVisible) return;

    /**
     * Handles closing the keyboard when clicking completely away from inputs or keyboard nodes.
     */
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("[data-virtual-keyboard='true']")) return;
      if (
        target.tagName.toLowerCase() === "input" ||
        target.tagName.toLowerCase() === "textarea" ||
        target.closest(".MuiInputAdornment-root")
      ) {
        return;
      }
      setKeyboardVisible(false);
      setActiveInput(null, null, null);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [
    useVirtualKeyboard,
    isKeyboardVisible,
    setKeyboardVisible,
    setActiveInput,
  ]);

  /**
   * Explicit action trigger to safely declare this field as the active target for any key emissions.
   */
  const registerAsActiveInput = () => {
    if (useVirtualKeyboard && elementRef) {
      setActiveInput(elementRef, onChange || null, fieldType);
    }
  };

  /**
   * Queries the DOM to push focus onto the next sequential text editable field wrapper.
   */
  const handleTabNavigation = () => {
    if (!globalElementRef?.current) return;

    const allFields = Array.from(
      document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        'input:not([type="hidden"]):not([disabled]), textarea:not([disabled])',
      ),
    );
    const currentIndex = allFields.indexOf(globalElementRef.current as any);

    let nextField: HTMLInputElement | HTMLTextAreaElement | null = null;

    if (currentIndex !== -1 && currentIndex < allFields.length - 1) {
      nextField = allFields[currentIndex + 1];
    } else if (allFields.length > 0) {
      nextField = allFields[0];
    }

    if (nextField) {
      const targetField = nextField;
      window.requestAnimationFrame(() => {
        targetField.focus();

        const reactPropsKey = Object.keys(targetField).find(
          (key) =>
            key.startsWith("__reactProps") ||
            key.startsWith("__reactEventHandlers"),
        );

        let targetOnChange = globalOnChange;
        let targetFieldType: "text" | "tel" | "number" | "phone-formatted" =
          "text";

        if (reactPropsKey) {
          const props = (targetField as any)[reactPropsKey];
          if (props?.onChange) targetOnChange = props.onChange;
          if (props?.type === "tel") targetFieldType = "tel";
          if (props?.type === "number") targetFieldType = "number";
          if (props?.dataVirtualType === "phone-formatted")
            targetFieldType = "phone-formatted";
        }

        const nextRef = { current: targetField };
        setActiveInput(nextRef, targetOnChange, targetFieldType);
      });
    }
  };

  /**
   * Evaluates whether the element target supports text selection operations.
   */
  const supportsSelection = (
    input: HTMLInputElement | HTMLTextAreaElement,
  ): boolean => {
    if (input.tagName.toLowerCase() === "textarea") return true;
    return ![
      "email",
      "number",
      "hidden",
      "color",
      "checkbox",
      "radio",
    ].includes((input as HTMLInputElement).type || "");
  };

  /**
   * Safely dispatches data matching downstream parameter constraints for standard fields or specialized phone fields.
   */
  const dispatchSyntheticChange = (
    input: HTMLInputElement | HTMLTextAreaElement,
    nextVal: string,
    changeCallback: ((event: any) => void) | null,
    isHardwareEmulation: boolean = false,
    isDeleting: boolean = false,
    targetCursor: number = 0,
  ) => {
    if (!changeCallback) return;
    const inputType = input.type || "";

    // Always deliver a full ChangeEvent payload shape down to registered components to maintain schema compliance
    changeCallback({
      target: {
        id: input.id,
        name: input.name,
        type: inputType,
        value: nextVal,
        selectionStart: targetCursor,
        selectionEnd: targetCursor,
      },
      currentTarget: {
        id: input.id,
        name: input.name,
        type: inputType,
        value: nextVal,
      },
      nativeEvent: {
        inputType: isDeleting ? "deleteContentBackward" : "insertText",
      },
    });
  };

  const handleKeyInsert = (char: string) => {
    if (!globalElementRef?.current) return;
    const input = globalElementRef.current;
    const currentVal = input.value;
    const isNumeric = ["tel", "number", "phone-formatted"].includes(
      globalFieldType || "",
    );

    if (isNumeric) {
      const isDigit = /^[0-9]$/.test(char);
      if (!isDigit) return;
    }

    if (!supportsSelection(input)) {
      const nextVal = currentVal + char;
      dispatchSyntheticChange(
        input,
        nextVal,
        globalOnChange,
        true,
        false,
        nextVal.length,
      );
      window.requestAnimationFrame(() => input.focus());
      return;
    }

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const nextVal =
      currentVal.substring(0, start) + char + currentVal.substring(end);
    const targetCursor = start + char.length;

    dispatchSyntheticChange(
      input,
      nextVal,
      globalOnChange,
      true,
      false,
      targetCursor,
    );
    window.requestAnimationFrame(() => {
      input.setSelectionRange(targetCursor, targetCursor);
      input.focus();
    });
  };

  const handleBackspace = () => {
    if (!globalElementRef?.current) return;
    const input = globalElementRef.current;
    const currentVal = input.value;

    if (!supportsSelection(input)) {
      const nextVal = currentVal.slice(0, -1);
      dispatchSyntheticChange(
        input,
        nextVal,
        globalOnChange,
        true,
        true,
        nextVal.length,
      );
      window.requestAnimationFrame(() => input.focus());
      return;
    }

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
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

    dispatchSyntheticChange(
      input,
      nextVal,
      globalOnChange,
      true,
      true,
      nextCursor,
    );
    window.requestAnimationFrame(() => {
      input.setSelectionRange(nextCursor, nextCursor);
      input.focus();
    });
  };

  const handleSpace = () => {
    if (["tel", "number", "phone-formatted"].includes(globalFieldType || ""))
      return;
    handleKeyInsert(" ");
  };

  return {
    showKeyboard: isKeyboardVisible,
    setShowKeyboard: setKeyboardVisible,
    useVirtualKeyboard,
    registerAsActiveInput,
    handleKeyInsert,
    handleBackspace,
    handleSpace,
    handleTabNavigation,
  };
};

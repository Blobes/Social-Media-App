"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { processPhoneFormatting } from "@repo/helpers";
import { InputStatus, MenuRef } from "@repo/core";
import { useInputValueValidation } from "./useInputValue";
import { CredentialType } from "./useInputField";

export interface UsePhoneFieldOptions {
  initialValue?: string;
  allowedTypes?: CredentialType[];
  includeCountryCode?: boolean;
  onClearFeedback?: () => void;
  onPhoneChange?: (value: string) => void;
}

/**
 * Manages validation, real-time formatting, country selector menus, and cursor alignment for phone input fields.
 */
export const usePhoneFieldValidation = ({
  initialValue = "",
  allowedTypes = ["PHONE"],
  includeCountryCode = true,
  onClearFeedback,
  onPhoneChange,
}: UsePhoneFieldOptions = {}) => {
  const { getInputValidity } = useInputValueValidation();
  const countryMenuRef = useRef<MenuRef>(null);
  const isCountrySelectedRef = useRef<boolean>(false);

  const [input, setInput] = useState(initialValue);
  const [validity, setValidity] = useState<InputStatus>();
  const [validationMsg, setValidationMsg] = useState("");

  const rawValidity = getInputValidity(input);
  const resolvedType = rawValidity.type ?? "UNKNOWN";

  const isTypeAllowed =
    !allowedTypes || allowedTypes.includes(resolvedType as CredentialType);
  const isValidInput = rawValidity.status === "VALID" && isTypeAllowed;

  useEffect(() => {
    if (input !== "" && isValidInput) {
      setValidity("VALID");
    }
  }, [initialValue, isValidInput]);

  /**
   * Updates state, validates current input against allowed credential types, and propagates changes.
   */
  const validateAndSet = useCallback(
    (value: string) => {
      setInput(value);
      onPhoneChange?.(value);

      const result = getInputValidity(value);
      const currentType = result.type ?? "UNKNOWN";
      const currentTypeAllowed =
        !allowedTypes || allowedTypes.includes(currentType as CredentialType);

      if (!currentTypeAllowed) {
        setValidity("INVALID");
        setValidationMsg("");
      } else {
        setValidity(result.status === "VALID" ? "VALID" : "INVALID");
        setValidationMsg(
          result.status === "INVALID" ? (result.message ?? "") : "",
        );
      }
    },
    [getInputValidity, allowedTypes, onPhoneChange],
  );

  /**
   * Processes phone input events, applies formatting rules, controls menu display, and preserves selection range.
   */
  const handlePhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = e.target as HTMLInputElement;
      const isDeleting =
        (e.nativeEvent as any)?.inputType === "deleteContentBackward";
      const start = target.selectionStart || 0;

      const result = processPhoneFormatting(
        target.value,
        start,
        isDeleting,
        includeCountryCode,
        isCountrySelectedRef.current,
      );

      if (result.shouldReset) {
        onClearFeedback?.();
        validateAndSet("");
        isCountrySelectedRef.current = false;
        return;
      }

      if (result.shouldOpenMenu) {
        countryMenuRef.current?.openMenu(target);
      }

      onClearFeedback?.();

      window.requestAnimationFrame(() => {
        target.setSelectionRange(result.nextCursor, result.nextCursor);
      });

      validateAndSet(result.nextVal);
    },
    [includeCountryCode, onClearFeedback, validateAndSet],
  );

  /**
   * Clears phone input value, resets selection state, and clears validation feedback.
   */
  const handleClear = useCallback(() => {
    setInput("");
    setValidity(undefined);
    setValidationMsg("");
    isCountrySelectedRef.current = false;
    onClearFeedback?.();
    onPhoneChange?.("");
  }, [onClearFeedback, onPhoneChange]);

  /**
   * Handles country menu closing when country selection is required.
   */
  const handleMenuClose = useCallback(() => {
    if (includeCountryCode && !isCountrySelectedRef.current) {
      handleClear();
    }
  }, [includeCountryCode, handleClear]);

  /**
   * Formats and sets phone prefix when a country item is selected from the menu.
   */
  const handleCountrySelect = useCallback(
    (countryCode: string) => {
      if (countryCode) {
        isCountrySelectedRef.current = true;
        const formattedPrefix = `(+${countryCode.replace(/\+/g, "")}) `;
        validateAndSet(formattedPrefix);
      }
    },
    [validateAndSet],
  );

  return {
    input,
    setInput,
    inputType: resolvedType,
    validity,
    validationMsg,
    isValidInput,
    countryMenuRef,
    isCountrySelectedRef,
    handlePhoneChange,
    handleClear,
    handleMenuClose,
    handleCountrySelect,
    validateAndSet,
  };
};

"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { formatPhoneNumber } from "@repo/helpers";
import { InputStatus, MenuRef } from "@repo/core";
import { useInputValidation } from "./useInputValidation";

export type CredentialType = "EMAIL" | "PHONE" | "USERNAME" | "UNKNOWN";

interface UseMixedInputOptions {
  initialValue?: string;
  allowedTypes?: CredentialType[];
  onClearFeedback?: () => void;
}

/**
 * Manages validation, real-time phone formatting, and selection range alignment for polymorphic input string credentials.
 */
export const useMixedInputValidation = ({
  initialValue = "",
  allowedTypes,
  onClearFeedback,
}: UseMixedInputOptions = {}) => {
  const { getInputValidity } = useInputValidation();
  const countryMenuRef = useRef<MenuRef>(null);

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

  const validateAndSet = useCallback(
    (value: string) => {
      setInput(value);
      const result = getInputValidity(value);
      const currentType = result.type ?? "UNKNOWN";
      const currentTypeAllowed =
        !allowedTypes || allowedTypes.includes(currentType as CredentialType);

      if (!currentTypeAllowed) {
        // Fall back to invalid without displaying an explicit message
        setValidity("INVALID");
        setValidationMsg("");
      } else {
        setValidity(result.status === "VALID" ? "VALID" : "INVALID");
        setValidationMsg(
          result.status === "INVALID" ? (result.message ?? "") : "",
        );
      }
    },
    [getInputValidity, allowedTypes],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = e.target as HTMLInputElement;
      const isDeleting =
        (e.nativeEvent as any).inputType === "deleteContentBackward";
      let start = target.selectionStart || 0;
      let inputValue = target.value;

      const hasLetters = /[a-zA-Z]/.test(inputValue);
      const isPhoneAttempt = /^[0-9+\(]/.test(inputValue);

      if (isPhoneAttempt && !hasLetters && inputValue.length > 0) {
        if (inputValue.length < 3) {
          countryMenuRef.current?.openMenu(target);
        }

        const oldLen = inputValue.length;
        inputValue = formatPhoneNumber(inputValue);
        const newLen = inputValue.length;

        if (!isDeleting) {
          start = start + (newLen - oldLen);
        }
      }
      onClearFeedback?.();
      window.requestAnimationFrame(() => {
        target.setSelectionRange(start, start);
      });
      validateAndSet(inputValue);
    },
    [onClearFeedback, validateAndSet],
  );

  return {
    input,
    setInput,
    inputType: resolvedType,
    validity,
    validationMsg,
    isValidInput,
    countryMenuRef,
    handleChange,
    validateAndSet,
  };
};

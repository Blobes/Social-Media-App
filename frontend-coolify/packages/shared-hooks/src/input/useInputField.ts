"use client";

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  RefObject,
} from "react";
import { formatPhoneNumber } from "@repo/helpers";
import { COMMON_INPUT_VALIDATION, InputStatus, MenuRef } from "@repo/core";
import { useInputValidationMsg } from "./useValMsg";
import { useStaticTranslation } from "../useTrans";

export type CredentialType = "EMAIL" | "PHONE" | "USERNAME" | "UNKNOWN";

interface UseInputFieldOptions {
  initialValue?: string;
  isRequired?: boolean;
  allowedTypes?: CredentialType[];
  inputRef?: RefObject<HTMLInputElement | null>;
  onClearFeedback?: () => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Manages validation, real-time phone formatting, and selection range alignment for polymorphic input string credentials.
 */
export const useInputFieldValidation = ({
  initialValue = "",
  isRequired = true,
  allowedTypes = ["EMAIL", "PHONE", "USERNAME", "UNKNOWN"],
  onClearFeedback,
  inputRef,
  onChange,
}: UseInputFieldOptions = {}) => {
  const { getInputValidity } = useInputValidationMsg();
  const countryMenuRef = useRef<MenuRef>(null);
  const { translateTxtString } = useStaticTranslation();

  const [input, setInput] = useState(initialValue);
  const [validity, setValidity] = useState<InputStatus>();
  const [validationMsg, setValidationMsg] = useState("");

  const rawValidity = getInputValidity(input);
  const resolvedType = rawValidity.type ?? "UNKNOWN";

  const isTypeAllowed =
    !allowedTypes || allowedTypes.includes(resolvedType as CredentialType);
  const isValidInput = rawValidity.status === "VALID" && isTypeAllowed;

  /**
   * Synchronizes internal input state when external initialValue changes.
   */
  useEffect(() => {
    if (initialValue !== undefined) {
      setInput(initialValue);
    }
  }, [initialValue]);

  /**
   * Evaluates input value against allowed credential types and sets state along with validation feedback messages.
   */
  const validateAndSet = useCallback(
    (value: string) => {
      setInput(value);

      if (!isRequired && value === "") {
        setValidationMsg("");
        return;
      }

      const result = getInputValidity(value);
      const currentType = result.type ?? "UNKNOWN";
      const currentTypeAllowed =
        !allowedTypes || allowedTypes.includes(currentType as CredentialType);

      if (!currentTypeAllowed) {
        setValidity("INVALID");
        setValidationMsg(
          translateTxtString(COMMON_INPUT_VALIDATION.invalid_input_value),
        );
      } else {
        setValidity(result.status === "VALID" ? "VALID" : "INVALID");
        setValidationMsg(
          result.status === "INVALID" ? (result.message ?? "") : "",
        );
      }
    },
    [getInputValidity, allowedTypes],
  );

  /**
   * Triggers field validation on blur to provide immediate visual feedback when an empty or incomplete field loses focus.
   */
  const handleBlur = useCallback(() => {
    if (input.trim() === "") {
      setValidity("INVALID");
      setValidationMsg(
        translateTxtString(COMMON_INPUT_VALIDATION.field_is_required),
      );
      return;
    }
    validateAndSet(input);
  }, [input, validateAndSet]);

  /**
   * Handles user change events, manages phone formatting adjustments, and preserves cursor positioning.
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = e.target as HTMLInputElement;
      const nativeEvent = e.nativeEvent as InputEvent | undefined;
      const isDeleting = nativeEvent?.inputType === "deleteContentBackward";
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

  /**
   * Dispatches native input events to sync state and trigger external change listeners.
   */
  const handleClear = useCallback(() => {
    setInput("");
    setValidity(undefined);
    setValidationMsg("");
    onClearFeedback?.();

    if (inputRef?.current) {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      nativeSetter?.call(inputRef.current, "");

      const event = new Event("input", { bubbles: true });
      inputRef.current.dispatchEvent(event);
    } else if (onChange) {
      const syntheticEvent = {
        target: { value: "" },
        currentTarget: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  }, [inputRef, onChange, onClearFeedback]);

  return {
    input,
    setInput,
    inputType: resolvedType,
    validity,
    validationMsg,
    isValidInput,
    countryMenuRef,
    handleChange,
    handleBlur,
    handleClear,
    validateAndSet,
  };
};

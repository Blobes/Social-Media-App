"use client";

import React, { useState, useCallback, useMemo } from "react";
import { InputStatus } from "@repo/core";
import { useInputValidationMsg } from "./useValMsg";

export interface UseEmailFieldOptions {
  initialValue?: string;
  isRequired?: boolean;
  onClearFeedback?: () => void;
  onEmailChange?: (value: string) => void;
}

/**
 * Manages email input state, synchronous pattern validation, and validation messages.
 */
export const useEmailInputValidation = ({
  initialValue = "",
  isRequired = true,
  onClearFeedback,
  onEmailChange,
}: UseEmailFieldOptions = {}) => {
  const { validateEmail } = useInputValidationMsg();

  const [email, setEmail] = useState(initialValue);
  const [emailValidity, setEmailValidity] = useState<InputStatus>();
  const [emailValidationMsg, setEmailValidationMsg] = useState("");

  const isEmailValid = useMemo(() => {
    return validateEmail(email).status === "VALID";
  }, [email, validateEmail]);

  /**
   * Processes email input updates from native form change events or direct string payloads.
   */
  const handleEmailChange = useCallback(
    (
      valueOrEvent:
        | string
        | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      onClearFeedback?.();

      const value =
        typeof valueOrEvent === "string"
          ? valueOrEvent
          : valueOrEvent.target.value;

      if (!isRequired && value === "") {
        setEmailValidationMsg("");
        return;
      }

      setEmail(value);
      onEmailChange?.(value);

      const result = validateEmail(value);
      setEmailValidity(result.status === "VALID" ? "VALID" : "INVALID");
      setEmailValidationMsg(
        result.status === "INVALID" ? (result.message ?? "") : "",
      );
    },
    [onClearFeedback, onEmailChange, validateEmail],
  );

  /**
   * Resets email input state and validation status.
   */
  const handleClearEmail = useCallback(() => {
    setEmail("");
    setEmailValidity(undefined);
    setEmailValidationMsg("");
    onClearFeedback?.();
    onEmailChange?.("");
  }, [onClearFeedback, onEmailChange]);

  return {
    email,
    setEmail,
    emailValidity,
    emailValidationMsg,
    isEmailValid,
    handleEmailChange,
    handleClearEmail,
  };
};

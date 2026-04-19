"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useGlobalStore } from "@repo/shared-hooks";
import { useMutation } from "@tanstack/react-query";
import { LoginService } from "../service";
import {
  delay,
  formatPhoneNumber,
  getInputValidity,
  sanitizePhoneNumber,
} from "@repo/helpers";
import { AccountStatus, InputStatus, MenuRef } from "@repo/core";
import { StepName } from "../../types";

interface UseIdentifier {
  existingInput?: string;
  setStep?: (step: StepName) => void;
  setIdentifier?: (credential: string) => void;
}

export const useIdentifier = ({
  existingInput,
  setStep,
  setIdentifier,
}: UseIdentifier) => {
  const { checkEmail, checkPhone, checkUsername } = LoginService();

  /**
   * Syncing with Zustand Store
   */
  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);

  const countryMenuRef = useRef<MenuRef>(null);

  // Local UI State
  const [input, setInput] = useState(existingInput ?? "");
  const [validity, setValidity] = useState<InputStatus>();
  const [validationMsg, setValidationMsg] = useState("");

  const inputValidity = getInputValidity(input);
  const isValidInput = inputValidity.status === "VALID";

  useEffect(() => {
    if (input !== "" && isValidInput) setValidity("VALID");
  }, [existingInput, isValidInput]);

  /**
   * TanStack Mutation handles the server-side check.
   * This replaces the manual try/catch and loading state management.
   */
  const { mutate, isPending: isAuthLoading } = useMutation({
    mutationFn: async (val: string) => {
      await delay();
      const inputType = inputValidity.type;
      const cleaned = inputType === "PHONE" ? sanitizePhoneNumber(val) : val;

      if (inputType === "EMAIL") return await checkEmail(cleaned);
      if (inputType === "PHONE") return await checkPhone(cleaned);
      return await checkUsername(cleaned, "LOGIN");
    },
    onSuccess: (res) => {
      const inputType = inputValidity.type;

      // 1. Handle Deactivated
      if (
        res.status === "SUCCESS" &&
        res.payload?.accountStatus === "DEACTIVATED"
      ) {
        setStep?.("RESTORE_ACCOUNT");
        return;
      }

      // 2. Handle Existing User
      if (res.status === "SUCCESS" && res.isExisting === true) {
        setIdentifier?.(input);
        setStep?.("PASSWORD");
      }
      // 3. Handle Credential Not Found
      else {
        setInlineMsg(
          `We couldn't find an account with the ${
            inputType?.toLowerCase() + (inputType === "PHONE" ? " number" : "")
          }.`,
        );
      }
    },
    onError: (error: any) => {
      setInlineMsg(error.message || "An error occurred. Please try again.");
    },
    onMutate: () => {
      setInlineMsg(null);
    },
  });

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

      setInput(inputValue);

      window.requestAnimationFrame(() => {
        target.setSelectionRange(start, start);
      });

      validateAndSet(inputValue);
    },
    [setInput, setValidity, setValidationMsg],
  );

  const validateAndSet = useCallback(
    (value: string) => {
      setInput(value);
      const result = getInputValidity(value);
      setValidity(result.status === "VALID" ? "VALID" : "INVALID");
      setValidationMsg(
        result.status === "INVALID" ? (result.message ?? "") : "",
      );
    },
    [setInput, setValidity, setValidationMsg],
  );

  /**
   * Submitting via the mutation trigger.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidInput || !input) return;
    mutate(input);
  };

  return {
    input,
    setInput,
    validity,
    validationMsg,
    isAuthLoading,
    handleChange,
    handleSubmit,
    isSubmitDisabled: validity === "INVALID" || input === "" || isAuthLoading,
    countryMenuRef,
    validateAndSet,
  };
};

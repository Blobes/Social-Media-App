"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { usePage } from "@repo/shared-hooks";
import { useMutation } from "@tanstack/react-query";
import { LoginService } from "../service";
import {
  delay,
  formatPhoneNumber,
  getInputValidity,
  sanitizePhoneNumber,
} from "@repo/helpers";
import { CLIENT_ROUTES, InputStatus, MenuRef, AuthStepName } from "@repo/core";
import { AppButton } from "@repo/shared-ui";
import { useTheme } from "@mui/material/styles";

interface UseIdentifier {
  existingInput?: string;
  setStep?: (step: AuthStepName) => void;
  setIdentifier?: (credential: string) => void;
}

export const useIdentifier = ({
  existingInput,
  setStep,
  setIdentifier,
}: UseIdentifier) => {
  const { checkEmail, checkPhone, checkUsername } = LoginService();
  const { navigateTo } = usePage();
  const theme = useTheme();
  const countryMenuRef = useRef<MenuRef>(null);

  // Local UI State
  const [input, setInput] = useState(existingInput ?? "");
  const [validity, setValidity] = useState<InputStatus>();
  const [validationMsg, setValidationMsg] = useState("");
  const [inlineMsg, setInlineMsg] = useState<React.ReactNode>(null);

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
      // `InputValidation.type` is optional in the type system, so guard it.
      const inputType = inputValidity.type ?? "UNKNOWN";
      const cleaned = inputType === "PHONE" ? sanitizePhoneNumber(val) : val;

      if (inputType === "EMAIL") return await checkEmail(cleaned);
      if (inputType === "PHONE") return await checkPhone(cleaned);
      return await checkUsername(cleaned, "LOGIN");
    },
    onSuccess: async (res) => {
      const inputType = inputValidity.type ?? "UNKNOWN";

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
          <span>
            {`We couldn't find an account with the ${
              inputType.toLowerCase() + (inputType === "PHONE" ? " number" : "")
            }.`}
            {inputType === "EMAIL" && (
              <AppButton
                variant="text"
                href={CLIENT_ROUTES.signup.path}
                onClick={handleSignupClick}
                style={{
                  color: theme.palette.primary.main,
                  fontSize: "14px",
                  "&:hover": { textDecoration: "underline" },
                }}>
                Create one
              </AppButton>
            )}
          </span>,
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

      setInlineMsg(null);
      //  setInput(inputValue);

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
  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!isValidInput || !input) return;
    mutate(input);
  };

  const handleSignupClick = useCallback((e: React.MouseEvent) => {
    setInlineMsg(null);
    navigateTo(CLIENT_ROUTES.signup, {
      event: e,
      loadPage: true,
      savePage: false,
    });
  }, []);

  return {
    input,
    inputType: inputValidity.type,
    setInput,
    validity,
    validationMsg,
    isAuthLoading,
    handleChange,
    handleSubmit,
    isSubmitDisabled: validity === "INVALID" || input === "" || isAuthLoading,
    countryMenuRef,
    validateAndSet,
    handleSignupClick,
    inlineMsg,
  };
};

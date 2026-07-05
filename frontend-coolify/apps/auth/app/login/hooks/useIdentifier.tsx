"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  useInputValidation,
  usePage,
  useStaticTranslation,
} from "@repo/shared-hooks";
import { useMutation } from "@tanstack/react-query";
import { LoginService } from "../service";
import { delay, formatPhoneNumber, sanitizePhoneNumber } from "@repo/helpers";
import {
  CLIENT_ROUTES,
  InputStatus,
  MenuRef,
  AuthStepName,
  AUTH_BUTTON_LABELS,
  AUTH_FEEDBACK,
  COMMON_FEEDBACK,
} from "@repo/core";
import { AppButton, TransText } from "@repo/shared-ui";
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
  const { translateTxtString } = useStaticTranslation();
  const { getInputValidity } = useInputValidation();
  const theme = useTheme();
  const countryMenuRef = useRef<MenuRef>(null);

  // Local UI State
  const [input, setInput] = useState(existingInput ?? "");
  const [validity, setValidity] = useState<InputStatus>();
  const [validationMsg, setValidationMsg] = useState("");
  const [inlineMsg, setInlineMsg] = useState<React.ReactNode | null>(null);

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

      if (res.status === "SUCCESS") {
        // 1. Handle Deactivated
        if (res.payload?.accountStatus === "DEACTIVATED") {
          setStep?.("RESTORE_ACCOUNT");
          return;
        }
        // 2. Handle Existing User
        if (res.isExisting === true) {
          setIdentifier?.(input);
          setStep?.("PASSWORD");
        }
      } else if (res.status === "ERROR") {
        // 3. Handle Credential Not Found
        if (res.httpStatus === 404) {
          setInlineMsg(
            <span>
              <TransText
                {...(inputType === "PHONE"
                  ? AUTH_FEEDBACK.no_account_found_phone
                  : AUTH_FEEDBACK.no_account_found_email)}
                noComponent
              />
              {inputType === "EMAIL" && (
                <AppButton
                  variant="text"
                  href={CLIENT_ROUTES.signup.path}
                  onClick={handleSignupClick}
                  style={{
                    ...theme.typography.caption,
                    color: theme.palette.primary.main,
                    "&:hover": { textDecoration: "underline" },
                  }}>
                  <TransText
                    {...AUTH_BUTTON_LABELS.create_account}
                    noComponent
                  />
                </AppButton>
              )}
            </span>,
          );
        }
      } else if (res.httpStatus === 403 && res.signedUpWith !== "EMAIL") {
        // 3. Handle account signed up with OAuth providers
        setInlineMsg(
          <span>
            {res.message}
            <AppButton
              variant="text"
              href={CLIENT_ROUTES.signup.path}
              onClick={handleSignupClick}
              style={{
                ...theme.typography.caption,
                color: theme.palette.primary.main,
                "&:hover": { textDecoration: "underline" },
              }}>
              <TransText {...AUTH_BUTTON_LABELS.set_password} noComponent />
            </AppButton>
          </span>,
        );
      } else {
        setInlineMsg(res.message);
      }
    },
    onError: (error: any) => {
      setInlineMsg(
        error.message || translateTxtString(COMMON_FEEDBACK.server_error),
      );
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

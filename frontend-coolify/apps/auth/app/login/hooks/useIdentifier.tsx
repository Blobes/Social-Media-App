"use client";

import React, { useState, useCallback } from "react";
import {
  useMixedInputValidation,
  usePage,
  useStaticTranslation,
} from "@repo/shared-hooks";
import { useMutation } from "@tanstack/react-query";
import { LoginService } from "../service";
import { delay, sanitizePhoneNumber } from "@repo/helpers";
import {
  CLIENT_ROUTES,
  AuthStepName,
  AUTH_BUTTON_LABELS,
  AUTH_FEEDBACK,
  COMMON_FEEDBACK,
  ApiError,
} from "@repo/core";
import { AppButton, TransText } from "@repo/shared-ui";
import { useTheme } from "@mui/material/styles";

interface UseIdentifier {
  existingInput?: string;
  setStep?: (step: AuthStepName) => void;
  setIdentifier?: (credential: string) => void;
}

/**
 * Coordinates server verification and routing workflows based on user account status.
 */
export const useIdentifier = ({
  existingInput,
  setStep,
  setIdentifier,
}: UseIdentifier) => {
  const { checkEmail, checkPhone, checkUsername } = LoginService();
  const { navigateTo } = usePage();
  const { translateTxtString } = useStaticTranslation();
  const theme = useTheme();

  const [inlineMsg, setInlineMsg] = useState<React.ReactNode | null>(null);

  const clearInlineMsg = useCallback(() => {
    setInlineMsg(null);
  }, []);

  const {
    input,
    setInput,
    inputType,
    validity,
    validationMsg,
    isValidInput,
    countryMenuRef,
    handleChange,
    validateAndSet,
  } = useMixedInputValidation({
    initialValue: existingInput,
    onClearFeedback: clearInlineMsg,
  });

  const { mutate, isPending: isAuthLoading } = useMutation({
    mutationFn: async (val: string) => {
      await delay();
      const resolvedType = inputType ?? "UNKNOWN";
      const cleaned = resolvedType === "PHONE" ? sanitizePhoneNumber(val) : val;

      if (resolvedType === "EMAIL") return await checkEmail(cleaned);
      if (resolvedType === "PHONE") return await checkPhone(cleaned);
      return await checkUsername(cleaned, "LOGIN");
    },
    onSuccess: async (res) => {
      const resolvedType = inputType ?? "UNKNOWN";

      if (res.status === "SUCCESS") {
        if (res.payload?.accountStatus === "DEACTIVATED") {
          setStep?.("RESTORE_ACCOUNT");
          return;
        }
        if (res.isExisting === true) {
          setIdentifier?.(input);
          setStep?.("PASSWORD");
        }
      } else if (res.status === "ERROR") {
        if (res.httpStatus === 404) {
          setInlineMsg(
            <span>
              <TransText
                {...(resolvedType === "PHONE"
                  ? AUTH_FEEDBACK.no_account_found_phone
                  : AUTH_FEEDBACK.no_account_found_email)}
                noComponent
              />
              {resolvedType === "EMAIL" && (
                <AppButton
                  variant="text"
                  href={CLIENT_ROUTES.signup.path}
                  onClick={handleSignupClick}
                  style={{
                    ...theme.typography.text5,
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
        setInlineMsg(
          <span>
            {res.localizedSuccessMsg || res.message}
            <AppButton
              variant="text"
              href={CLIENT_ROUTES.signup.path}
              onClick={handleSignupClick}
              style={{
                ...theme.typography.text5,
                color: theme.palette.primary.main,
                "&:hover": { textDecoration: "underline" },
              }}>
              <TransText {...AUTH_BUTTON_LABELS.set_password} noComponent />
            </AppButton>
          </span>,
        );
      } else {
        setInlineMsg(res.localizedSuccessMsg || res.message);
      }
    },
    onError: (error: ApiError) => {
      setInlineMsg(
        error.localizedErrMsg ||
          translateTxtString(COMMON_FEEDBACK.server_error),
      );
    },
    onMutate: () => {
      clearInlineMsg();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidInput || !input) return;
    mutate(input);
  };

  const handleSignupClick = useCallback(
    (e: React.MouseEvent) => {
      setInlineMsg(null);
      navigateTo(CLIENT_ROUTES.signup, {
        event: e,
        loadPage: true,
        savePage: false,
      });
    },
    [navigateTo],
  );

  const handleResetPassClick = useCallback(
    (e: React.MouseEvent) => {
      setInlineMsg(null);
      navigateTo(CLIENT_ROUTES.resetPassword, {
        event: e,
        loadPage: true,
        savePage: false,
      });
    },
    [navigateTo],
  );

  return {
    input,
    inputType,
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
    handleResetPassClick,
    inlineMsg,
  };
};

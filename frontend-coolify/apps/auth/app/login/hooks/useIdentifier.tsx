"use client";

import React, { useState, useCallback } from "react";
import {
  useInputFieldValidation,
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
  GenericStyle,
} from "@repo/core";
import { AnchorLink, TransText } from "@repo/shared-ui";
import { useTheme } from "@mui/material/styles";

interface UseIdentifier {
  existingInput?: string;
  setStep?: (step: AuthStepName) => void;
  setIdentifier?: (credential: string) => void;
  inlineTxtStyle?: GenericStyle;
}

/**
 * Coordinates server verification and routing workflows based on user account status.
 */
export const useIdentifier = ({
  existingInput,
  setStep,
  setIdentifier,
  inlineTxtStyle,
}: UseIdentifier) => {
  const { checkEmail, checkPhone, checkUsername } = LoginService();
  const { navigateTo } = usePage();
  const { translateTxtString } = useStaticTranslation();
  const theme = useTheme();

  const [inlineMsg, setInlineMsg] = useState<React.ReactNode | null>(null);

  const clearInlineMsg = useCallback(() => {
    setInlineMsg(null);
  }, []);

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
  } = useInputFieldValidation({
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
    onSuccess: (res) => {
      if (res.status === "SUCCESS") {
        if (res.payload?.accountStatus === "DEACTIVATED") {
          setStep?.("RESTORE_ACCOUNT");
          return;
        }
        if (res.isExisting === true) {
          setIdentifier?.(input);
          setStep?.("PASSWORD");
        }
      }
    },
    onError: (error: ApiError) => {
      const resolvedType = inputType ?? "UNKNOWN";
      const payload = error.payload;

      if (error.httpStatus === 404) {
        setInlineMsg(
          <span>
            <TransText
              {...(resolvedType === "PHONE"
                ? AUTH_FEEDBACK.no_account_found_phone
                : resolvedType === "EMAIL"
                  ? AUTH_FEEDBACK.no_account_found_email
                  : AUTH_FEEDBACK.no_account_found_username)}
              noComponent
            />
            {resolvedType === "EMAIL" && (
              <AnchorLink
                href={CLIENT_ROUTES.signup.path}
                onClick={handleSignupClick}
                style={{
                  ...theme.typography.text5,
                  marginLeft: theme.gap(2),
                  ...inlineTxtStyle,
                }}>
                <TransText {...AUTH_BUTTON_LABELS.create_account} noComponent />
              </AnchorLink>
            )}
          </span>,
        );
        return;
      }

      if (error.httpStatus === 403 && payload?.signedUpWith !== "EMAIL") {
        setInlineMsg(
          <span>
            {error.localizedErrMsg || error.message}
            <AnchorLink
              href={CLIENT_ROUTES.resetPassword.path}
              onClick={handleResetPassClick}
              style={{
                ...theme.typography.text5,
                marginLeft: theme.gap(2),
                ...inlineTxtStyle,
              }}>
              <TransText {...AUTH_BUTTON_LABELS.set_password} noComponent />
            </AnchorLink>
          </span>,
        );
        return;
      }

      setInlineMsg(
        error.localizedErrMsg ||
          translateTxtString(COMMON_FEEDBACK.server_error),
      );
    },
    onMutate: () => {
      clearInlineMsg();
    },
  });

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!isValidInput || !input) return;
    mutate(input);
  };

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

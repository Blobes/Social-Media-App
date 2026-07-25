"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { delay, formatRemainingTime } from "@repo/helpers";
import { AuthStepName, ApiError } from "@repo/core";
import { LoginService } from "../service";
import { useLoginFeedback } from "./useFeedback";
import { usePasswordFieldValidation } from "@repo/shared-hooks";
import { TransText } from "@repo/shared-ui";
import { useTheme } from "@mui/material/styles";

export interface UseLogin {
  identifier: string;
  setStep?: (step: AuthStepName) => void;
}

/**
 * Coordinates user login mutation state and handles feedback delegation.
 */
export const useLogin = ({ identifier, setStep }: UseLogin) => {
  const { login } = LoginService();
  const { handleSuccess, handleError } = useLoginFeedback({
    identifier,
    setStep,
  });
  const theme = useTheme();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const inlineMsgStyle = useMemo(
    () => ({
      ...theme.typography.text5,
      color: theme.palette.gray[0],
      background: theme.palette.error.main,
      padding: theme.boxSpacing(0, 3),
      margin: theme.boxSpacing(0, 3, 1, 3),
      borderRadius: theme.radius[1],
    }),
    [theme],
  );

  const passwordValidation = usePasswordFieldValidation({
    mode: "AUTHENTICATE",
  });
  const {
    password,
    handlePasswordChange,
    isLocked,
    remainingSec,
    inlineMsg,
    setInlineMsg,
    attemptFeedback,
    errorMsg,
    passwordValidity,
    handleFailedAttempts,
    MAX_ATTEMPTS,
    LOCKOUT_MIN,
  } = passwordValidation;

  /**
   * Syncs attempt error descriptor objects into UI translation component tree.
   */
  useEffect(() => {
    if (!attemptFeedback) return;

    setInlineMsg(
      <TransText
        component="span"
        {...attemptFeedback.feedbackConfig}
        inlineComponents={{ counter: <strong style={inlineMsgStyle} /> }}
      />,
    );
  }, [attemptFeedback, inlineMsgStyle, setInlineMsg]);

  /**
   * Executes authentication mutation request.
   */
  const { mutate, isPending: isMutationLoading } = useMutation({
    mutationFn: async () => {
      await delay();
      return await login({ identifier, password });
    },
    onSuccess: (res) => {
      setIsRedirecting(true);
      handleSuccess(res);
    },
    onError: (err: ApiError) => {
      setIsRedirecting(false);
      handleError(err, handleFailedAttempts, setInlineMsg);
    },
  });

  /**
   * Handles authentication form submission event.
   */
  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (isLocked) return;
    mutate();
  };

  return {
    password,
    passwordValidity,
    onPasswordChange: handlePasswordChange,
    handleSubmit,
    isLocked,
    remainingSec,
    formattedSec: formatRemainingTime(remainingSec),
    isAuthLoading: isMutationLoading || isRedirecting,
    inlineMsg,
    inlineMsgStyle,
    setInlineMsg,
    errorMsg,
    MAX_ATTEMPTS,
    LOCKOUT_MIN,
  };
};

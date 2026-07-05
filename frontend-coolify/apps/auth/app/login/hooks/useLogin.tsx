"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { useSnackbar, useStaticTranslation } from "@repo/shared-hooks";
import { useMutation } from "@tanstack/react-query";
import { useLockCountdown } from "./useLockCount";
import { setCookie, getCookie, delay } from "@repo/helpers";
import { InputStatus, AuthStepName, AUTH_FEEDBACK } from "@repo/core";
import { LoginService } from "../service";
import { clearLoginLock, formatRemainingTime } from "@repo/features";
import { useLoginFeedback } from "./useFeedback";
import { TransText } from "@repo/shared-ui";

const MAX_ATTEMPTS = 3;
const LOCKOUT_MIN = 2;

export interface UseLogin {
  identifier: string;
  setStep?: (step: AuthStepName) => void;
}

export const useLogin = ({ identifier, setStep }: UseLogin) => {
  const theme = useTheme();
  const { login } = LoginService();
  const { setSBMessage } = useSnackbar();
  const { handleSuccess, handleError } = useLoginFeedback({
    identifier,
    setStep,
  });
  const { translateTxtString } = useStaticTranslation();

  const [inlineMsg, setInlineMsg] = useState<React.ReactNode | null>(null);
  const [activeLockTime, setActiveLockTime] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordValidity, setPasswordValidity] = useState<InputStatus>();
  const [errorMsg, setErrorMsg] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  const inlineMsgStyle = {
    color: theme.palette.gray[0],
    background: theme.palette.error.main,
    padding: theme.boxSpacing(0, 3),
    margin: theme.boxSpacing(0, 3, 1, 3),
    borderRadius: theme.radius[1],
    ...theme.typography.caption,
  };

  const resetLockStates = useCallback(() => {
    setActiveLockTime(null);
    setInlineMsg(null);
  }, [setInlineMsg]);

  const { remainingSec, isLocked } = useLockCountdown(
    activeLockTime,
    LOCKOUT_MIN,
    useCallback(() => {
      resetLockStates();
      setSBMessage({
        msg: {
          tagline: translateTxtString(AUTH_FEEDBACK.login_activated_tagline),
          msgStatus: "SUCCESS",
        },
      });
    }, [resetLockStates, setSBMessage]),
  );

  useEffect(() => {
    const lockTime = getCookie("loginLockTime");
    const attempts = getCookie("loginAttempts");
    if (lockTime) {
      setActiveLockTime(lockTime);
    } else if (attempts) {
      clearLoginLock();
      resetLockStates();
    }
  }, [resetLockStates]);

  useEffect(() => {
    if (isLocked) {
      setInlineMsg(
        <TransText
          component="span"
          {...AUTH_FEEDBACK.password_locked(formatRemainingTime(remainingSec))}
          inlineComponents={{ timer: <strong style={inlineMsgStyle} /> }}
        />,
      );
    }
  }, [remainingSec, isLocked, setInlineMsg]);

  const handleFailedPassword = useCallback(() => {
    const current = parseInt(getCookie("loginAttempts") || "0", 10);
    const nextAttempts = current + 1;
    const attemptsLeft = MAX_ATTEMPTS - nextAttempts;

    setCookie("loginAttempts", String(nextAttempts), LOCKOUT_MIN);
    if (nextAttempts >= MAX_ATTEMPTS) {
      const lockTime = String(Date.now());
      setCookie("loginLockTime", String(lockTime), LOCKOUT_MIN);
      setActiveLockTime(lockTime);
      return true;
    }
    setInlineMsg(
      <TransText
        component="span"
        {...(attemptsLeft === 1
          ? AUTH_FEEDBACK.incorrect_password_attempts_one(attemptsLeft)
          : AUTH_FEEDBACK.incorrect_password_attempts_many(attemptsLeft))}
        inlineComponents={{ counter: <strong style={inlineMsgStyle} /> }}
      />,
    );
    return false;
  }, [setInlineMsg, theme]);

  const { mutate, isPending: isMutationLoading } = useMutation({
    mutationFn: async () => {
      await delay();
      return await login({ identifier, password });
    },
    onSuccess: (res) => {
      setIsRedirecting(true);
      handleSuccess(res);
    },
    onError: (err) => {
      setIsRedirecting(false);
      handleError(err, handleFailedPassword, setInlineMsg);
    },
  });

  const onPasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setInlineMsg(null);
      setPassword(value);

      if (value.length >= 6) {
        setPasswordValidity("VALID");
        setErrorMsg("");
      } else if (value.length === 0) {
        setPasswordValidity("INVALID");
        setErrorMsg("Password is required.");
      } else {
        setPasswordValidity(undefined);
      }
    },
    [setInlineMsg, setPassword],
  );

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (isLocked) return;
    mutate();
  };

  return {
    password,
    passwordValidity,
    onPasswordChange,
    handleSubmit,
    isLocked,
    remainingSec,
    isAuthLoading: isMutationLoading || isRedirecting,
    inlineMsg,
    setInlineMsg,
    errorMsg,
  };
};

"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { useSnackbar, usePage, useGlobalStore } from "@repo/shared-hooks";
import { useMutation } from "@tanstack/react-query";
import { useLockCountdown } from "./useLockCount";
import {
  setCookie,
  getCookie,
  getFromLocalStorage,
  delay,
} from "@repo/helpers";
import { CLIENT_ROUTES, InputStatus, IPage } from "@repo/core";
import { LoginService } from "../service";
import { clearLoginLock, formatRemainingTime } from "@repo/features";
import { StepName } from "../../types";

const MAX_ATTEMPTS = 3;
const LOCKOUT_MIN = 2;

interface UseLogin {
  identifier: string;
  setStep?: (step: StepName) => void;
}

export const useLogin = ({ identifier, setStep }: UseLogin) => {
  const theme = useTheme();
  const { login } = LoginService();
  const { isOnWeb, navigateTo } = usePage();
  const { setSBMessage } = useSnackbar();

  const inlineMsg = useGlobalStore((state) => state.inlineMsg);
  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);
  const setGlobalLoading = useGlobalStore((state) => state.setGlobalLoading);
  const setAuthUser = useGlobalStore((state) => state.setAuthUser);
  const setAuthStatus = useGlobalStore((state) => state.setAuthStatus);

  // Form & Lock State
  const [activeLockTime, setActiveLockTime] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordValidity, setPasswordValidity] = useState<InputStatus>();
  const [errorMsg, setErrorMsg] = useState("");

  const inlineMsgStyle = {
    color: theme.palette.gray[0],
    background: theme.palette.primary.main,
    padding: theme.boxSpacing(0, 3),
    margin: theme.boxSpacing(0, 3, 1, 3),
    borderRadius: theme.radius[1],
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
        msg: { tagline: "Login Activated", msgStatus: "SUCCESS" },
      });
    }, [resetLockStates, setSBMessage]),
  );

  /**
   * Process failed attempts and set cookies
   */
  const handleFailedPassword = useCallback(() => {
    const current = parseInt(getCookie("loginAttempts") || "0", 10);
    const nextAttempts = current + 1;

    setCookie("loginAttempts", String(nextAttempts), LOCKOUT_MIN);
    if (nextAttempts >= MAX_ATTEMPTS) {
      const lockTime = String(Date.now());
      setCookie("loginLockTime", String(lockTime), LOCKOUT_MIN);
      setActiveLockTime(lockTime);
      return true;
    }

    setInlineMsg(
      <span>
        <strong>Incorrect password. </strong>You have{" "}
        <strong style={inlineMsgStyle}>{MAX_ATTEMPTS - nextAttempts}</strong>
        {MAX_ATTEMPTS - nextAttempts === 1 ? "attempt" : "attempts"} left before
        your login is temporarily locked.
      </span>,
    );
    return false;
  }, [setInlineMsg, theme]);

  // TanStack Mutation for Login
  const { mutate, isPending: isAuthLoading } = useMutation({
    mutationFn: async () => {
      // Simulate network delay if needed
      await delay();
      return await login({ identifier, password });
    },
    onSuccess: (res) => {
      if (res.httpStatus === 200) {
        clearLoginLock();

        if (res.status === "DEACTIVATED") {
          setAuthStatus("DEACTIVATED");
          if (setStep) setStep("RESTORE_ACCOUNT");
        }

        if (res.status === "SUCCESS") {
          setGlobalLoading(true);
          setAuthUser(res.payload);
          setAuthStatus("AUTHENTICATED");

          if (setStep) setStep("IDENTIFIER");

          const savedPage = getFromLocalStorage<IPage>();
          const page =
            savedPage && !isOnWeb(savedPage.path)
              ? savedPage
              : CLIENT_ROUTES.home;
          navigateTo(page);
        }
      }
    },
    onError: (error: any) => {
      const isPasswordErr = error.status === "UNAUTHORIZED";
      if (isPasswordErr) {
        handleFailedPassword();
      } else {
        setInlineMsg(error.message || "Login failed");
      }
    },
  });

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
        <span>
          You've exceeded the maximum login attempts. Try again in{" "}
          <strong style={inlineMsgStyle}>
            {formatRemainingTime(remainingSec)}
          </strong>
          . Or reset your password.
        </span>,
      );
    }
  }, [remainingSec, isLocked, setInlineMsg]);

  const onPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = e.target.value;
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
  };

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
    isAuthLoading,
    inlineMsg,
    errorMsg,
  };
};

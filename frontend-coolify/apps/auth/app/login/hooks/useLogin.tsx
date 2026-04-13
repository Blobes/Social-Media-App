"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { useGlobalContext, useSnackbar, usePage } from "@repo/shared-state";
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

const MAX_ATTEMPTS = 3;
const LOCKOUT_MIN = 2;

export const useLogin = ({ email, setStep }: any) => {
  const { login } = LoginService();
  const theme = useTheme();

  const inlineStyle = {
    color: theme.palette.gray[0],
    background: theme.palette.primary.main,
    padding: theme.boxSpacing(0, 3),
    margin: theme.boxSpacing(0, 3, 1, 3),
    borderRadius: theme.radius[1],
  };

  const {
    inlineMsg,
    setInlineMsg,
    isAuthLoading,
    setAuthLoading,
    setGlobalLoading,
    setAuthUser,
    setAuthStatus,
  } = useGlobalContext();
  const { isOnWeb, navigateTo } = usePage();
  const { setSBMessage } = useSnackbar();
  // Manage Lock State
  const [activeLockTime, setActiveLockTime] = useState<string | null>(null);
  // Form State
  const [password, setPassword] = useState("");
  const [passwordValidity, setPasswordValidity] = useState<InputStatus>();
  const [errorMsg, setErrorMsg] = useState("");

  const resetLockStates = useCallback(() => {
    setActiveLockTime(null);
    setInlineMsg(null);
  }, [setInlineMsg]);

  // FACTOR IN THE COMPLETION LOGIC
  const { remainingSec, isLocked } = useLockCountdown(
    activeLockTime,
    LOCKOUT_MIN,
    useCallback(() => {
      resetLockStates();
      setSBMessage({
        msg: { content: "Login Activated", msgStatus: "SUCCESS" },
      });
    }, [resetLockStates, setSBMessage]),
  );

  // An Effect to grab the cookie once on mount
  useEffect(() => {
    const lockTime = getCookie("loginLockTime");
    const attempts = getCookie("loginAttempts");

    if (lockTime) {
      setActiveLockTime(lockTime);
    } else if (attempts) {
      // No lock, but old attempts exist: Wipe them on refresh
      clearLoginLock();
      resetLockStates();
    }
  }, [resetLockStates]);

  // Sync lock time with feedback UI
  useEffect(() => {
    if (isLocked) {
      setInlineMsg(
        <span>
          You've exceeded the maximum login attempts. Try again in{" "}
          <strong style={inlineStyle}>
            {formatRemainingTime(remainingSec)}
          </strong>
          . Or reset your password.
        </span>,
      );
    }
  }, [remainingSec, isLocked, setInlineMsg]);

  // Logic to process failures
  const handleFailedAttempt = useCallback(() => {
    const current = parseInt(getCookie("loginAttempts") || "0", 10);
    const nextAttempts = current + 1;

    setCookie("loginAttempts", String(nextAttempts), LOCKOUT_MIN);
    if (nextAttempts >= MAX_ATTEMPTS) {
      const lockTime = String(Date.now());
      setCookie("loginLockTime", String(lockTime), LOCKOUT_MIN);
      setActiveLockTime(lockTime);
      return true; // Is now locked
    }
    setInlineMsg(
      <span>
        <strong>Incorrect password. </strong>You have{" "}
        <strong style={inlineStyle}>{MAX_ATTEMPTS - nextAttempts}</strong>
        {MAX_ATTEMPTS - nextAttempts === 1 ? "attempt" : "attempts"} left before
        your login is temporarily locked.
      </span>,
    );
    return false;
  }, [setInlineMsg]);

  // Passowrd change Handlers
  const onPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = e.target.value;
    if (value.length >= 6) {
      setPassword(value);
      setPasswordValidity("VALID");
      setErrorMsg("");
    } else if (value.length === 0) {
      setPasswordValidity("INVALID");
      setErrorMsg("Password is required.");
    } else {
      setPassword(value);
      setPasswordValidity(undefined);
    }
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (isLocked) return;
    setAuthLoading(true);
    try {
      const res = await login({ email, password });

      if (res.status === "SUCCESS") {
        // Cleanup cookie on success
        clearLoginLock();
        // Reset the stepper for the next time they open it
        if (setStep) setStep("email");

        // Navigate
        setGlobalLoading(true);
        const savedPage = getFromLocalStorage<IPage>();
        const savedPath = savedPage ? savedPage.path : "";
        const isLastWeb = isOnWeb(savedPath);
        const page = !isLastWeb && savedPage ? savedPage : CLIENT_ROUTES.home;
        navigateTo(page);

        setAuthUser(res.payload);
        setAuthStatus("AUTHENTICATED");
      }
    } catch (error: any) {
      const isPasswordErr = error.message?.toLowerCase().includes("password");

      if (isPasswordErr) {
        handleFailedAttempt();
      } else {
        setInlineMsg(error.message || "Login failed");
      }
    } finally {
      await delay();
      setAuthLoading(false);
    }
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

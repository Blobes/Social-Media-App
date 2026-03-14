import { useState, useCallback, useEffect } from "react";
import { useGlobalContext, useSnackbar, usePage } from "@repo/shared-state";
import { useLockCountdown } from "./useLockCount";
import {
  setCookie,
  deleteCookie,
  getCookie,
  getFromLocalStorage,
  delay,
  clientRoutes,
  formatRemainingTime,
} from "@repo/helpers";
import { IPage } from "@repo/types";
import { LoginService } from "../service";

const MAX_ATTEMPTS = 3;
const LOCKOUT_MIN = 2;

export const useLogin = ({ email, setStep }: any) => {
  const { login } = LoginService();
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
  // 1. Manage Lock State
  const [activeLockTime, setActiveLockTime] = useState<string | null>(
    getCookie("loginLockTime"),
  );
  // 2. Form State
  const [password, setPassword] = useState("");
  const [passwordValidity, setPasswordValidity] = useState<
    "valid" | "invalid"
  >();
  const [errorMsg, setErrorMsg] = useState("");

  // 1. FACTOR IN THE COMPLETION LOGIC
  const { remainingSec, isLocked } = useLockCountdown(
    activeLockTime,
    LOCKOUT_MIN,
    () => {
      setActiveLockTime(null);
      setInlineMsg(null);
      setSBMessage({
        msg: { content: "Login Activated", msgStatus: "SUCCESS" },
      });
    },
  );

  // Sync lock time with feedback UI
  useEffect(() => {
    if (isLocked) {
      setInlineMsg(
        `You've exceeded the maximum login attempts. 
            Try again in ${formatRemainingTime(remainingSec)}.
             Or reset your password.`,
      );
    }
  }, [remainingSec, isLocked, setInlineMsg]);

  // 3. Logic to process failures
  const handleFailedAttempt = useCallback(() => {
    const current = parseInt(getCookie("loginAttempts") || "0", 10);
    const nextAttempts = current + 1;

    setCookie("loginAttempts", String(nextAttempts), LOCKOUT_MIN);

    if (nextAttempts >= MAX_ATTEMPTS) {
      const lockTime = String(Date.now());
      setCookie("loginLockTime", String(lockTime), LOCKOUT_MIN);
      setInlineMsg(`Locked. Please try again later.`);
      setActiveLockTime(lockTime);
      return true; // Is now locked
    }

    setInlineMsg(
      `Wrong password. ${MAX_ATTEMPTS - nextAttempts} attempts left.`,
    );
    return false;
  }, [setInlineMsg]);

  // 4. Action Handlers
  const onPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = e.target.value;
    if (value.length >= 6) {
      setPassword(value);
      setPasswordValidity("valid");
      setErrorMsg("");
    } else if (value.length === 0) {
      setPasswordValidity("invalid");
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
        // Cleanup on success
        deleteCookie("loginAttempts");
        deleteCookie("loginLockTime");

        // Reset the stepper for the next time they open it
        if (setStep) setStep("email");

        // Navigate
        setGlobalLoading(true);
        const savedPage = getFromLocalStorage<IPage>();
        const savedPath = savedPage ? savedPage.path : "";
        const isLastWeb = isOnWeb(savedPath);
        const page = !isLastWeb && savedPage ? savedPage : clientRoutes.home;
        navigateTo(page, { type: "external" });

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

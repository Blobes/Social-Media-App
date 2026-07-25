"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { useTheme } from "@mui/material/styles";
import { Check } from "lucide-react";
import { useInputValidationMsg } from "./useValMsg";
import { useGuides } from "../useGuides";
import { useStaticTranslation } from "../useTrans";
import { AUTH_FEEDBACK, InputStatus } from "@repo/core";
import {
  setCookie,
  getCookie,
  getLockRemaining,
  clearLoginLock,
} from "@repo/helpers";
import { useSnackbar } from "../useSnackbar";

const MAX_ATTEMPTS = 3;
const LOCKOUT_MIN = 2;

export interface UseValidationOptions {
  mode?: "CREATE" | "AUTHENTICATE";
  onLockComplete?: () => void;
}

export type AttemptErrorFeedback = {
  feedbackConfig: ReturnType<
    typeof AUTH_FEEDBACK.incorrect_password_attempts_one
  >;
  attemptsLeft: number;
};

interface CountdownResult {
  remainingSec: number;
  isLocked: boolean;
  clearLock: () => void;
}

/**
 * Manages password value states, criteria verification, lock countdowns, and field validation across creation and auth flows.
 */
export const usePasswordFieldValidation = (
  options: UseValidationOptions = {},
) => {
  const { mode = "CREATE", onLockComplete } = options;

  const theme = useTheme();
  const { validatePassword } = useInputValidationMsg();
  const { INPUT_GUIDES } = useGuides();
  const { translateTxtString } = useStaticTranslation();
  const { setSBMessage } = useSnackbar();

  // Shared states
  const [password, setPassword] = useState("");
  const [passwordValidity, setPasswordValidity] = useState<InputStatus>();
  const [errorMsg, setErrorMsg] = useState("");
  const [inlineMsg, setInlineMsg] = useState<React.ReactNode | null>(null);
  const [attemptFeedback, setAttemptFeedback] =
    useState<AttemptErrorFeedback | null>(null);

  // CREATE Mode states
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [confirmPassErrMsg, setConfirmPassErrMsg] = useState<string>("");

  // AUTHENTICATE Mode states
  const [activeLockTime, setActiveLockTime] = useState<string | null>(null);

  /**
   * Resets internal lock timestamp and inline feedback state.
   */
  const resetLockStates = useCallback(() => {
    setActiveLockTime(null);
    setInlineMsg(null);
    setAttemptFeedback(null);
  }, []);

  /**
   * Lock countdown handler active during AUTHENTICATE mode.
   */
  const { remainingSec, isLocked, clearLock } = useLockCountdown(
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
      if (onLockComplete) onLockComplete();
    }, [resetLockStates, setSBMessage, translateTxtString, onLockComplete]),
  );

  /**
   * Hydrates lockout cookies on client mount for AUTHENTICATE mode.
   */
  useEffect(() => {
    if (mode !== "AUTHENTICATE") return;

    const lockTime = getCookie("loginLockTime");
    const attempts = getCookie("loginAttempts");

    if (lockTime) {
      setActiveLockTime(lockTime);
    } else if (attempts) {
      clearLoginLock();
      resetLockStates();
    }
  }, [mode, resetLockStates]);

  /**
   * Evaluates character types and structural constraints for password criteria.
   */
  const passwordCriteria = useMemo(() => {
    const hasAnyLetter = /\p{Letter}/u.test(password);
    const containsCasedScript = /\p{Cased_Letter}/u.test(password);

    const isLowercaseValid = containsCasedScript
      ? /\p{Lowercase_Letter}/u.test(password)
      : hasAnyLetter;
    const isUppercaseValid = containsCasedScript
      ? /\p{Uppercase_Letter}/u.test(password)
      : hasAnyLetter;

    return {
      hasMinLength: password.length >= 8,
      hasLowercase: isLowercaseValid,
      hasUppercase: isUppercaseValid,
      hasNumeric: /\p{Number}/u.test(password),
      hasSpecial: /[\p{Punctuation}\p{Symbol}]/u.test(password),
    };
  }, [password]);

  /**
   * Generates icon and color visual helper states based on active criteria results.
   */
  const passwordVisualStates = useMemo(() => {
    if (!password) return [];

    const details = INPUT_GUIDES.PASSWORD.guideDetails;
    const criteriaKeys: (keyof typeof passwordCriteria)[] = [
      "hasMinLength",
      "hasUppercase",
      "hasNumeric",
      "hasSpecial",
    ];

    return details.map((item, idx) => {
      const key = criteriaKeys[idx] || "hasMinLength";
      const pass = passwordCriteria[key];

      return {
        id: item.id,
        icon: pass ? (
          <Check size={16} stroke={theme.palette.success.dark} />
        ) : undefined,
        textColor: pass ? theme.palette.success.dark : undefined,
      };
    });
  }, [password, passwordCriteria, theme, INPUT_GUIDES]);

  /**
   * Validates structural password status.
   */
  const isPasswordValid = useMemo(() => {
    return validatePassword(password).status === "VALID";
  }, [password, validatePassword]);

  /**
   * Updates base password and re-evaluates match status against existing confirmation value.
   */
  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.target.value;
      setInlineMsg(null);
      setAttemptFeedback(null);
      setPassword(val);

      if (mode === "AUTHENTICATE") {
        if (val.length >= 6) {
          setPasswordValidity("VALID");
          setErrorMsg("");
        } else if (val.length <= 3) {
          setPasswordValidity("INVALID");
          if (val.length === 0)
            setErrorMsg(
              translateTxtString(AUTH_FEEDBACK.passwords_is_required),
            );
        } else {
          setPasswordValidity(undefined);
        }
        return;
      }

      if (confirmPassword && val !== confirmPassword) {
        setConfirmPassErrMsg(
          translateTxtString(AUTH_FEEDBACK.passwords_do_not_match),
        );
      } else {
        setConfirmPassErrMsg("");
      }
    },
    [confirmPassword, translateTxtString, mode],
  );

  /**
   * Updates confirmation password and evaluates match status against current base password value.
   */
  const handleConfirmChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.target.value;
      setConfirmPassword(val);

      if (password && val !== password) {
        setConfirmPassErrMsg(
          translateTxtString(AUTH_FEEDBACK.passwords_do_not_match),
        );
      } else {
        setConfirmPassErrMsg("");
      }
    },
    [password, translateTxtString],
  );

  /**
   * Increments failed attempt cookies and sets lockout states or exposes error attempt data.
   */
  const handleFailedAttempts = useCallback(() => {
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

    const feedbackConfig =
      attemptsLeft === 1
        ? AUTH_FEEDBACK.incorrect_password_attempts_one(attemptsLeft)
        : AUTH_FEEDBACK.incorrect_password_attempts_many(attemptsLeft);

    setAttemptFeedback({ feedbackConfig, attemptsLeft });
    return false;
  }, []);

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    confirmPassErrMsg,
    setConfirmPassErrMsg,
    passwordCriteria,
    passwordVisualStates,
    isPasswordValid,
    handlePasswordChange,
    handleConfirmChange,
    passwordValidity,
    setPasswordValidity,
    errorMsg,
    setErrorMsg,
    inlineMsg,
    setInlineMsg,
    attemptFeedback,
    setAttemptFeedback,
    isLocked,
    remainingSec,
    handleFailedAttempts,
    resetLockStates,
    clearLock,
    MAX_ATTEMPTS,
    LOCKOUT_MIN,
  };
};

/**
 * Manages interval state calculations for authentication lockout expiration.
 */
export const useLockCountdown = (
  lockTimestamp: string | number | null,
  lockoutMin: number,
  onComplete?: () => void,
): CountdownResult => {
  const [remainingSec, setRemainingSec] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Clears ongoing timer intervals and resets stored lockout metadata.
   */
  const clearLock = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRemainingSec(0);
    clearLoginLock();
  }, []);

  useEffect(() => {
    if (!lockTimestamp) return;

    const lockTime = Number(lockTimestamp);

    const tick = () => {
      const remaining = getLockRemaining(lockTime, lockoutMin);
      if (remaining <= 0) {
        clearLock();
        if (onComplete) onComplete();
      } else {
        setRemainingSec(remaining);
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [lockTimestamp, lockoutMin, clearLock, onComplete]);

  return {
    remainingSec,
    isLocked: remainingSec > 0,
    clearLock,
  };
};

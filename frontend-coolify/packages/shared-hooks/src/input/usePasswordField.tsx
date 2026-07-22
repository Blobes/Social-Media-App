"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import { Check } from "lucide-react";
import { useInputValueValidation } from "./useInputValue";
import { useGuides } from "../useGuides";
import { useStaticTranslation } from "../useTrans";
import { AUTH_FEEDBACK } from "@repo/core";

/**
 * Manages password value states, criteria verification, confirmation comparisons, and UI helper visual states.
 */
export const usePasswordFieldValidation = () => {
  const theme = useTheme();
  const { validatePassword } = useInputValueValidation();
  const { INPUT_GUIDES } = useGuides();
  const { translateTxtString } = useStaticTranslation();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [confirmPassErrMsg, setConfirmPassErrMsg] = useState<string>("");

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

  const isPasswordValid = useMemo(() => {
    return validatePassword(password).status === "VALID";
  }, [password, validatePassword]);

  /**
   * Updates base password and re-evaluates match status against existing confirmation value.
   */
  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.target.value;
      setPassword(val);

      if (confirmPassword && val !== confirmPassword) {
        setConfirmPassErrMsg(
          translateTxtString(AUTH_FEEDBACK.passwords_do_not_match),
        );
      } else {
        setConfirmPassErrMsg("");
      }
    },
    [confirmPassword, translateTxtString],
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
  };
};

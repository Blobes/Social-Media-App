"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import { Check } from "lucide-react";
import { useGuides, useInputValidation } from "@repo/shared-hooks";

/**
 * Manages password value states, criteria verification, and UI helper visual states.
 */
export const usePasswordValidation = () => {
  const theme = useTheme();
  const { validatePassword } = useInputValidation();
  const { INPUT_GUIDES } = useGuides();

  const [password, setPassword] = useState("");

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

  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setPassword(e.target.value);
    },
    [],
  );

  return {
    password,
    setPassword,
    passwordCriteria,
    passwordVisualStates,
    isPasswordValid,
    handlePasswordChange,
  };
};

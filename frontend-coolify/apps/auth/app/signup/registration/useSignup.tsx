"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTheme } from "@mui/material/styles";
import { useGuides, useInputValidation, usePage } from "@repo/shared-hooks";
import { Check } from "lucide-react";
import { InputStatus, CLIENT_ROUTES } from "@repo/core";
import { delay, sanitizePhoneNumber } from "@repo/helpers";
import { SignupService } from "../service";
import { useSignupFeedback } from "./useFeedback";

/**
 * Hook managing structural field changes, error cleanups, and dynamic validation checks for registration.
 */
export const useSignup = () => {
  const theme = useTheme();
  const { createAccount } = SignupService();
  const { navigateTo } = usePage();
  const { validateEmail, validatePassword, validatePhone } =
    useInputValidation();
  const { INPUT_GUIDES } = useGuides();

  const [inlineMsg, setInlineMsg] = useState<React.ReactNode | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [emailValidity, setEmailValidity] = useState<InputStatus>();
  const [emailValidationMsg, setEmailValidationMsg] = useState("");
  const [phoneValidity, setPhoneValidity] = useState<InputStatus>();
  const [phoneValidationMsg, setPhoneValidationMsg] = useState("");

  const { handleSuccess, handleError } = useSignupFeedback({ email });

  const passwordCriteria = useMemo(() => {
    return {
      hasMinLength: password.length >= 8,
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasNumeric: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  // Map real-time validation state directly to the original IDs from INPUT_GUIDES
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
        id: item.id, // Keeps 'pass-detail1', 'pass-detail2', etc.
        icon: pass ? (
          <Check size={16} stroke={theme.palette.success.dark} />
        ) : undefined,
        textColor: pass ? theme.palette.success.dark : undefined,
      };
    });
  }, [password, passwordCriteria, theme]);

  const isPasswordValid = useMemo(() => {
    return validatePassword(password).status === "VALID";
  }, [password]);

  const isEmailValid = useMemo(() => {
    return validateEmail(email).status === "VALID";
  }, [email]);

  const isFormValid = useMemo(() => {
    const isPhoneValid =
      phone === "" || validatePhone(phone).status === "VALID";
    return isEmailValid && isPasswordValid && isPhoneValid;
  }, [isEmailValid, isPasswordValid, phone]);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      await delay();
      const cleanedPhone = phone ? sanitizePhoneNumber(phone) : undefined;
      return await createAccount({
        email: email.toLowerCase().trim(),
        password,
        phone: cleanedPhone,
      });
    },
    onSuccess: (res) => {
      setIsRedirecting(true);
      handleSuccess(res);
    },
    onError: (err) => {
      setIsRedirecting(false);
      handleError(err, setInlineMsg);
    },
  });

  const clearInlineMsg = useCallback(() => {
    setInlineMsg(null);
  }, []);

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      clearInlineMsg();
      setEmail(value);

      const result = validateEmail(value);
      setEmailValidity(result.status === "VALID" ? "VALID" : "INVALID");
      setEmailValidationMsg(
        result.status === "INVALID" ? (result.message ?? "") : "",
      );
    },
    [],
  );

  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      clearInlineMsg();
      setPassword(e.target.value);
    },
    [],
  );

  const handleLoginClick = useCallback(
    (e: React.MouseEvent) => {
      clearInlineMsg();
      navigateTo(CLIENT_ROUTES.login, {
        event: e,
        loadPage: true,
        savePage: false,
      });
    },
    [navigateTo],
  );

  const handlePhoneChange = useCallback((value: string) => {
    setPhone(value);
    if (value === "") {
      setPhoneValidity(undefined);
      setPhoneValidationMsg("");
    } else {
      const result = validatePhone(value);
      setPhoneValidity(result.status === "VALID" ? "VALID" : "INVALID");
      setPhoneValidationMsg(
        result.status === "INVALID" ? (result.message ?? "") : "",
      );
    }
  }, []);

  const handleSubmit = (e: React.SubmitEvent) => {
    clearInlineMsg();
    e.preventDefault();
    if (!isFormValid) return;
    mutate();
  };

  return {
    email,
    phone,
    password,
    emailValidity,
    emailValidationMsg,
    phoneValidity,
    phoneValidationMsg,
    passwordCriteria,
    passwordVisualStates,
    isPasswordValid,
    handleEmailChange,
    handlePhoneChange,
    handlePasswordChange,
    handleSubmit,
    isSubmitLoading: isPending || isRedirecting,
    isSubmitDisabled:
      !isFormValid ||
      isPending ||
      emailValidity === "INVALID" ||
      phoneValidity === "INVALID",
    inlineMsg,
    handleLoginClick,
    clearInlineMsg,
  };
};

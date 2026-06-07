"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTheme } from "@mui/material/styles";
import { usePage } from "@repo/shared-hooks";
import { Check, Dot } from "lucide-react";
import { INPUT_GUIDES, MenuRef, InputStatus, CLIENT_ROUTES } from "@repo/core";
import {
  delay,
  formatPhoneNumber,
  sanitizePhoneNumber,
  validateEmail,
  validatePassword,
  validatePhone,
} from "@repo/helpers";
import { SignupService } from "../service";
import { useSignupFeedback } from "./useFeedback";

/**
 * Hook managing structural field changes, error cleanups, and dynamic validation checks for registration.
 */
export const useSignup = () => {
  const theme = useTheme();
  const { createAccount } = SignupService();
  const { navigateTo } = usePage();

  const [inlineMsg, setInlineMsg] = useState<React.ReactNode | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [emailValidity, setEmailValidity] = useState<InputStatus>();
  const [emailValidationMsg, setEmailValidationMsg] = useState("");
  const [phoneValidity, setPhoneValidity] = useState<InputStatus>();
  const [phoneValidationMsg, setPhoneValidationMsg] = useState("");

  const isCountrySelectedRef = useRef<boolean>(false);
  const countryMenuRef = useRef<MenuRef>(null);
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
          <Check size={16} stroke={theme.palette.success.main} />
        ) : undefined,
        textColor: pass ? theme.palette.success.main : undefined,
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

  const onEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setInlineMsg(null);
      setEmail(value);

      const result = validateEmail(value);
      setEmailValidity(result.status === "VALID" ? "VALID" : "INVALID");
      setEmailValidationMsg(
        result.status === "INVALID" ? (result.message ?? "") : "",
      );
    },
    [],
  );

  const validateAndSetPhone = useCallback((value: string) => {
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

  const onPhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = e.target as HTMLInputElement;
      const isDeleting =
        (e.nativeEvent as any).inputType === "deleteContentBackward";

      let start = target.selectionStart || 0;
      let inputValue = target.value;

      if (isDeleting && inputValue.length <= 6) {
        setInlineMsg(null);
        setPhone("");
        setPhoneValidity(undefined);
        setPhoneValidationMsg("");
        isCountrySelectedRef.current = false;
        return;
      }

      if (
        !isDeleting &&
        inputValue.length > 0 &&
        !isCountrySelectedRef.current
      ) {
        countryMenuRef.current?.openMenu(target);
      }

      const oldLen = inputValue.length;
      inputValue = formatPhoneNumber(inputValue);
      const newLen = inputValue.length;

      if (!isDeleting) {
        start = start + (newLen - oldLen);
      }

      setInlineMsg(null);

      window.requestAnimationFrame(() => {
        target.setSelectionRange(start, start);
      });

      validateAndSetPhone(inputValue);
    },
    [validateAndSetPhone],
  );

  const handleMenuClose = useCallback(() => {
    if (!isCountrySelectedRef.current) {
      setPhone("");
      setPhoneValidity(undefined);
      setPhoneValidationMsg("");
    }
  }, []);

  const handleCountrySelect = useCallback(
    (dialCode: string) => {
      isCountrySelectedRef.current = true;
      validateAndSetPhone(dialCode);
    },
    [validateAndSetPhone],
  );

  const onPasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setInlineMsg(null);
      setPassword(e.target.value);
    },
    [],
  );

  const handleLoginClick = useCallback(
    (e: React.MouseEvent) => {
      setInlineMsg(null);
      navigateTo(CLIENT_ROUTES.login, {
        event: e,
        loadPage: true,
        savePage: false,
      });
    },
    [navigateTo],
  );

  const handleSubmit = (e: React.SubmitEvent) => {
    setInlineMsg(null);
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
    onEmailChange,
    onPhoneChange,
    onPasswordChange,
    handleSubmit,
    handleMenuClose,
    handleCountrySelect,
    validateAndSetPhone,
    isSubmitLoading: isPending || isRedirecting,
    isSubmitDisabled:
      !isFormValid ||
      isPending ||
      emailValidity === "INVALID" ||
      phoneValidity === "INVALID",
    countryMenuRef,
    inlineMsg,
    handleLoginClick,
  };
};

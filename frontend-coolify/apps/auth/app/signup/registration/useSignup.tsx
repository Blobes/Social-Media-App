"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTheme } from "@mui/material/styles";
import { useGlobalStore } from "@repo/shared-hooks";
import { Check, Dot } from "lucide-react";
import { INPUT_GUIDES, MenuRef, InputStatus } from "@repo/core";
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
  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Input states tracking live error messages and validation statuses
  const [emailValidity, setEmailValidity] = useState<InputStatus>();
  const [emailValidationMsg, setEmailValidationMsg] = useState("");

  const [phoneValidity, setPhoneValidity] = useState<InputStatus>();
  const [phoneValidationMsg, setPhoneValidationMsg] = useState("");

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

  const activeValidationVisuals = useMemo(() => {
    if (!password) return undefined;

    const baseGuide = INPUT_GUIDES.PASSWORD;
    const details = baseGuide.guideDetails;

    const criteriaKeys: (keyof typeof passwordCriteria)[] = [
      "hasMinLength",
      "hasUppercase",
      "hasLowercase",
      "hasNumeric",
      "hasSpecial",
    ];

    const updatedDetails = details.map((item, idx) => {
      const key = criteriaKeys[idx] || "hasMinLength";
      const pass = passwordCriteria[key];

      return {
        id: item.id,
        detail: item.detail,
        icon: pass ? (
          <Check size={14} stroke={theme.palette.success.main} />
        ) : (
          <Dot size={14} stroke={theme.palette.gray[200]} />
        ),
        textColor: pass ? theme.palette.success.main : theme.palette.gray[200],
      };
    });

    return {
      id: "live-password-detail",
      icon: <Dot size={14} />,
      textColor: theme.palette.gray[200],
      customDetails: updatedDetails,
    };
  }, [password, passwordCriteria, theme]);

  const adjustedPasswordGuides = useMemo(() => {
    if (!activeValidationVisuals) return [INPUT_GUIDES.PASSWORD];
    return [
      {
        ...INPUT_GUIDES.PASSWORD,
        guideDetails: activeValidationVisuals.customDetails,
      },
    ];
  }, [activeValidationVisuals]);

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
      handleSuccess(res);
    },
    onError: (err) => {
      handleError(err);
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
    [setInlineMsg],
  );

  const onPhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = e.target as HTMLInputElement;
      const isDeleting =
        (e.nativeEvent as any).inputType === "deleteContentBackward";

      let start = target.selectionStart || 0;
      let inputValue = target.value;

      if (!isDeleting && inputValue.length < 3) {
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
    [setInlineMsg, setPhone],
  );

  const validateAndSetPhone = useCallback(
    (value: string) => {
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
    },
    [setPhone],
  );

  const onPasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setInlineMsg(null);
      setPassword(e.target.value);
    },
    [setInlineMsg],
  );

  const handleSubmit = (e: React.FormEvent) => {
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
    activeValidationVisuals,
    adjustedPasswordGuides,
    isPasswordValid,
    onEmailChange,
    onPhoneChange,
    onPasswordChange,
    handleSubmit,
    validateAndSetPhone,
    isAuthLoading: isPending,
    isSubmitDisabled:
      !isFormValid ||
      isPending ||
      emailValidity === "INVALID" ||
      phoneValidity === "INVALID",
    countryMenuRef,
  };
};

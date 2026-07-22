"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  useInputValueValidation,
  usePage,
  usePasswordFieldValidation,
} from "@repo/shared-hooks";
import { InputStatus, CLIENT_ROUTES, ApiError } from "@repo/core";
import { sanitizePhoneNumber } from "@repo/helpers";
import { SignupService } from "../service";
import { useSignupFeedback } from "./useFeedback";

/**
 * Coordinates form states, validation routines, and registration mutations for user account creation.
 */
export const useSignup = () => {
  const { createAccount } = SignupService();
  const { navigateTo } = usePage();
  const { validateEmail, validatePhone } = useInputValueValidation();

  const [inlineMsg, setInlineMsg] = useState<React.ReactNode | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailValidity, setEmailValidity] = useState<InputStatus>();
  const [emailValidationMsg, setEmailValidationMsg] = useState("");
  const [phoneValidity, setPhoneValidity] = useState<InputStatus>();
  const [phoneValidationMsg, setPhoneValidationMsg] = useState("");

  const { handleSuccess, handleError } = useSignupFeedback({ email });

  const clearInlineMsg = useCallback(() => {
    setInlineMsg(null);
  }, []);

  const {
    password,
    passwordVisualStates,
    isPasswordValid,
    handlePasswordChange,
  } = usePasswordFieldValidation();

  /**
   * TanStack Mutation handles server account provisioning.
   */
  const { mutate: executeSignup, isPending: isSignupPending } = useMutation({
    mutationFn: async () => {
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
    onError: (err: ApiError) => {
      setIsRedirecting(false);
      handleError(err, setInlineMsg);
    },
    onMutate: () => {
      clearInlineMsg();
    },
  });

  const isEmailValid = useMemo(() => {
    return validateEmail(email).status === "VALID";
  }, [email, validateEmail]);

  const isFormValid = useMemo(() => {
    const isPhoneValid =
      phone === "" || validatePhone(phone).status === "VALID";
    return isEmailValid && isPasswordValid && isPhoneValid;
  }, [isEmailValid, isPasswordValid, phone, validatePhone]);

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
    [clearInlineMsg, validateEmail],
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
    [navigateTo, clearInlineMsg],
  );

  const handlePhoneChange = useCallback(
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
    [validatePhone],
  );

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    executeSignup();
  };

  return {
    email,
    phone,
    password,
    emailValidity,
    emailValidationMsg,
    phoneValidity,
    phoneValidationMsg,
    passwordVisualStates,
    isPasswordValid,
    handleEmailChange,
    handlePhoneChange,
    handlePasswordChange,
    handleSubmit,
    isSubmitLoading: isSignupPending || isRedirecting,
    isSubmitDisabled:
      !isFormValid ||
      isSignupPending ||
      emailValidity === "INVALID" ||
      phoneValidity === "INVALID",
    inlineMsg,
    handleLoginClick,
    clearInlineMsg,
  };
};

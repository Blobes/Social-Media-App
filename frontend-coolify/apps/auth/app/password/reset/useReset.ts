"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  useCachedData,
  useInputFieldValidation,
  usePage,
  usePasswordFieldValidation,
  useStaticTranslation,
} from "@repo/shared-hooks";
import { useMutation } from "@tanstack/react-query";
import { useAuthNavigation, usePopup } from "@repo/features";
import { useOtp } from "../../otp/useOtp";
import {
  delay,
  sanitizePhoneNumber,
  getCookie,
  deleteCookie,
  setCookie,
  queryClient,
} from "@repo/helpers";
import {
  CLIENT_ROUTES,
  COMMON_FEEDBACK,
  AUTH_INPUT,
  ApiError,
  OtpChannel,
  AUTH_FEEDBACK,
  CACHE_KEYS,
  TransitData,
} from "@repo/core";
import { ResetPasswordService } from "./service";
import { OtpService } from "../../otp/service";
import { ResetStepProps } from "../../types";

/**
 * Orchestrates local view states, text transformations, input sanitization, and state engines for password modification.
 */
export const useReset = ({ existingInput, step, setStep }: ResetStepProps) => {
  const { initiateReset, setPassword } = ResetPasswordService();
  const { initiateTFA } = OtpService();
  const { handleSendOtp } = useOtp();
  const { handleOtpNavigation } = useAuthNavigation();
  const { navigateTo } = usePage();
  const { translateTxtString } = useStaticTranslation();
  const { openPopup } = usePopup();

  const [inlineMsg, setInlineMsg] = useState<React.ReactNode | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(120);

  const cachedEntries = useCachedData<TransitData<"PASSWORD_RESET">>(
    CACHE_KEYS.PASS_RESET_FINALIZED_TRANSIT_DATA,
  );
  const resetTransitData = cachedEntries?.[0];

  const clearInlineMsg = useCallback(() => {
    setInlineMsg(null);
  }, []);

  useEffect(() => {
    if (resetTransitData?.payload?.nextStep) {
      setStep?.(resetTransitData.payload.nextStep);
    }
  }, [resetTransitData, setStep]);

  useEffect(() => {
    const resetSession = getCookie("reset_session_expiry");
    if (!resetSession) {
      if (step === "NEW_PASSWORD") {
        deleteCookie("reset_session_expiry");
        navigateTo(CLIENT_ROUTES.login);
      }
      return;
    }
    const interval = setInterval(() => {
      const diff = Math.max(
        0,
        Math.round((parseInt(resetSession, 10) - Date.now()) / 1000),
      );
      setTimeLeft(diff);

      if (diff <= 0) {
        clearInterval(interval);
        deleteCookie("reset_session_expiry");
        navigateTo(CLIENT_ROUTES.login);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [navigateTo]);

  const {
    input,
    setInput,
    inputType,
    validity,
    validationMsg,
    isValidInput,
    countryMenuRef,
    handleChange,
    validateAndSet,
  } = useInputFieldValidation({
    initialValue: existingInput,
    allowedTypes: ["EMAIL", "PHONE"],
    onClearFeedback: clearInlineMsg,
  });

  const {
    password,
    confirmPassword,
    confirmPassErrMsg,
    passwordVisualStates,
    isPasswordValid,
    handlePasswordChange,
    handleConfirmChange,
  } = usePasswordFieldValidation();

  /**
   * TanStack Mutation handles password reset finalized confirmations.
   */
  const { mutate: submitNewPassword, isPending: isConfirmLoading } =
    useMutation({
      mutationFn: async () => {
        await delay();
        return await setPassword(password);
      },
      onSuccess: (res) => {
        if (res.status === "SUCCESS") {
          queryClient.removeQueries({
            queryKey: CACHE_KEYS.PASS_RESET_FINALIZED_TRANSIT_DATA,
          });
          openPopup("RESET_PASSWORD_SUCCESS");
          //  navigateTo(CLIENT_ROUTES.login);
        } else {
          setInlineMsg(
            res.localizedSuccessMsg ||
              res.message ||
              translateTxtString(
                AUTH_FEEDBACK.password_reset_finalization_failed,
              ),
          );
        }
      },
      onError: (error: ApiError) => {
        setInlineMsg(
          error.localizedErrMsg ||
            translateTxtString(COMMON_FEEDBACK.server_error),
        );
      },
      onMutate: () => {
        clearInlineMsg();
      },
    });

  /**
   * Standard identity recovery verification strategy.
   */
  const { mutate: executeOtpInitiate, isPending: isStandardLoading } =
    useMutation({
      mutationFn: async (val: string) => {
        await delay();
        const resolvedType = inputType ?? "UNKNOWN";
        const cleaned =
          resolvedType === "PHONE" ? sanitizePhoneNumber(val) : val;
        return await initiateReset(cleaned);
      },
      onSuccess: (res) => {
        if (res.status === "SUCCESS" && res.payload) {
          const sessionDurationMinutes = 10;
          const expiryTimestamp =
            Date.now() + sessionDurationMinutes * 60 * 1000;

          setCookie(
            "reset_session_expiry",
            expiryTimestamp.toString(),
            sessionDurationMinutes,
          );

          const channel: OtpChannel =
            res.payload.resetType === "PHONE" ? "PHONE" : "EMAIL";

          handleSendOtp({
            recipient: res.payload.destination,
            purpose: "PASSWORD_RESET",
            channel,
          });

          handleOtpNavigation({
            user: null as any,
            identifier: input,
            inputType: channel,
            reason: "PASSWORD_RESET",
            purpose: "PASSWORD_RESET",
            method: channel,
          });
        } else {
          setInlineMsg(
            res.localizedSuccessMsg ||
              res.message ||
              translateTxtString(
                AUTH_FEEDBACK.password_reset_initiation_failed,
              ),
          );
        }
      },
      onError: (error: ApiError) => {
        setInlineMsg(
          error.localizedErrMsg ||
            translateTxtString(COMMON_FEEDBACK.server_error),
        );
      },
      onMutate: () => {
        clearInlineMsg();
      },
    });

  /**
   * Secondary verification strategy utilizing the structured object required by initiateTFA.
   */
  const { mutate: executeTFAInitiate, isPending: isTFALoading } = useMutation({
    mutationFn: async (val: string) => {
      await delay();
      const resolvedType = inputType ?? "UNKNOWN";
      const cleaned = resolvedType === "PHONE" ? sanitizePhoneNumber(val) : val;

      return await initiateTFA({
        purpose: "AUTHENTICATE",
        identifier: cleaned,
      });
    },
    onSuccess: (res) => {
      if (res.status === "SUCCESS" && res.payload) {
        const resolvedType = inputType ?? "UNKNOWN";
        const channel: OtpChannel =
          resolvedType === "PHONE" ? "PHONE" : "EMAIL";

        handleOtpNavigation({
          user: null as any,
          identifier: input,
          inputType: channel,
          reason: "PASSWORD_RESET",
          purpose: "PASSWORD_RESET",
          method: "AUTHENTICATOR",
          transitKey: CACHE_KEYS.PASS_RESET_INIT_TRANSIT_DATA,
        });
      } else {
        setInlineMsg(
          res.localizedSuccessMsg ||
            res.message ||
            translateTxtString(AUTH_FEEDBACK.password_reset_initiation_failed),
        );
      }
    },
    onError: (error: ApiError) => {
      setInlineMsg(
        error.localizedErrMsg ||
          translateTxtString(COMMON_FEEDBACK.server_error),
      );
    },
    onMutate: () => {
      clearInlineMsg();
    },
  });

  const handleStandardSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!isValidInput || !input) return;
    executeOtpInitiate(input);
  };

  const handleTFASubmit = useCallback(() => {
    if (!isValidInput || !input) return;
    executeTFAInitiate(input);
  }, [isValidInput, input, executeTFAInitiate]);

  const passwordsMatch = password !== "" && password === confirmPassword;
  const isNewPasswordSubmitDisabled =
    isConfirmLoading || !isPasswordValid || !passwordsMatch || timeLeft <= 0;

  /**
   * Dispatches payload updates on valid data validation thresholds.
   */
  const handleNewPasswordSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (isNewPasswordSubmitDisabled) return;
    submitNewPassword();
  };

  return {
    input,
    setInput,
    inputType,
    validity,
    validationMsg,
    inlineMsg,
    setInlineMsg,
    timeLeft,
    password,
    passwordVisualStates,
    isPasswordValid,
    confirmPassword,
    confirmPassErrMsg,
    isAuthLoading: isStandardLoading || isConfirmLoading || isTFALoading,
    isSubmitDisabled:
      validity === "INVALID" ||
      input === "" ||
      isStandardLoading ||
      isTFALoading,
    isNewPasswordSubmitDisabled,
    countryMenuRef,
    handleChange,
    validateAndSet,
    handlePasswordChange,
    handleConfirmChange,
    handleStandardSubmit,
    handleTFASubmit,
    handleNewPasswordSubmit,
  };
};

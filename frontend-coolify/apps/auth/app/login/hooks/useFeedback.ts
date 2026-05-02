"use client";

import { usePage, useGlobalStore, useSnackbar } from "@repo/shared-hooks";
import { queryClient, getFromLocalStorage } from "@repo/helpers";
import { CACHE_KEYS, CLIENT_ROUTES, IPage, OtpTransitData } from "@repo/core";
import { OtpService } from "../../verify-otp/service";
import { StepName } from "../../types";
import { clearLoginLock } from "@repo/features";

interface UseLoginFeedbackProps {
  identifier: string;
  setStep?: (step: StepName) => void;
}

export const useLoginFeedback = ({
  identifier,
  setStep,
}: UseLoginFeedbackProps) => {
  const { navigateTo, isOnWeb } = usePage();
  const { sendOtp } = OtpService();

  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);
  const setGlobalLoading = useGlobalStore((state) => state.setGlobalLoading);
  const setAuthUser = useGlobalStore((state) => state.setAuthUser);
  const setAuthStatus = useGlobalStore((state) => state.setAuthStatus);

  /**
   * Handles successful login response and conditional routing.
   */
  const handleSuccess = async (res: any) => {
    if (res.httpStatus !== 200) return;

    const user = res.payload;
    clearLoginLock();

    // 1. Account Deactivation Handling
    if (res.status === "DEACTIVATED") {
      setAuthStatus("DEACTIVATED");
      if (setStep) setStep("RESTORE_ACCOUNT");
      return;
    }

    if (res.status === "SUCCESS" && user) {
      const transitData = queryClient.getQueryData<OtpTransitData<"LOGIN">>([
        CACHE_KEYS.LOGIN_TRANSIT_DATA,
      ]);

      /**
       * 2. Verification Flow
       * Sending users with unverified credentials to OTP verification.
       */
      const isVerified = user.isEmailVerified || user.isPhoneVerified;
      if (!isVerified) {
        queryClient.setQueryData([CACHE_KEYS.LOGIN_TRANSIT_DATA], {
          ...transitData,
          payload: user,
        });

        const targetIdentifier = user.email || user.phoneNumber || identifier;
        await sendOtp({ identifier: targetIdentifier });

        navigateTo(CLIENT_ROUTES.verifyOtp, { loadPage: true });
        return;
      }

      /**
       * 3. Onboarding Flow
       * Checking if the user needs to complete or resume onboarding.
       */
      if (!user.isOnboarded) {
        setAuthUser(user);
        setAuthStatus("AUTHENTICATED");

        queryClient.setQueryData([CACHE_KEYS.ONBOARDING_TRANSIT_DATA], {
          userId: user._id,
          step: user.onboardingStep || "START",
          source: "LOGIN_FLOW",
        });

        const target = user.onboardingStep
          ? CLIENT_ROUTES.onboardingContinuation
          : CLIENT_ROUTES.onboarding;

        navigateTo(target);
        return;
      }

      /**
       * 4. Standard Dashboard Redirect
       * Finalizing authentication for verified and onboarded users.
       */
      setGlobalLoading(true);
      setAuthUser(user);
      setAuthStatus("AUTHENTICATED");

      if (setStep) setStep("IDENTIFIER");

      const savedPage = getFromLocalStorage<IPage>();
      const page =
        savedPage && !isOnWeb(savedPage.path) ? savedPage : CLIENT_ROUTES.home;
      navigateTo(page);
    }
  };

  /**
   * Handles login mutation errors and lockout feedback.
   */
  const handleError = (error: any, handleFailedPassword: () => void) => {
    const isPasswordErr = error.status === "UNAUTHORIZED";
    if (isPasswordErr) {
      handleFailedPassword();
    } else {
      setInlineMsg(error.message || "Login failed");
    }
  };

  return { handleSuccess, handleError };
};

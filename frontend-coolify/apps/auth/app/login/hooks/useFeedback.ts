"use client";

import { usePage, useGlobalStore } from "@repo/shared-hooks";
import { queryClient, getFromLocalStorage } from "@repo/helpers";
import {
  CACHE_KEYS,
  CLIENT_ROUTES,
  IPage,
  IUser,
  OnboardingTransitData,
  OtpTransitData,
} from "@repo/core";
import { OtpService } from "../../otp/service";
import { clearLoginLock } from "@repo/features";
import { UseLogin } from "./useLogin";
import { LoginResponse } from "../service";
import { useIdentifier } from "./useIdentifier";

export const useLoginFeedback = ({ identifier, setStep }: UseLogin) => {
  const { navigateTo, isOnWeb } = usePage();
  const { sendOtp } = OtpService();
  const { inputType } = useIdentifier({ existingInput: identifier });

  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);
  const setGlobalLoading = useGlobalStore((state) => state.setGlobalLoading);
  const setAuthUser = useGlobalStore((state) => state.setAuthUser);
  const setAuthStatus = useGlobalStore((state) => state.setAuthStatus);

  /**
   * Processes successful login and routes based on account state.
   */
  const handleSuccess = async (res: LoginResponse) => {
    if (res.httpStatus !== 200) return;

    const user = res.payload as IUser;
    clearLoginLock();

    // Handling deactivated accounts immediately
    if (res.status === "DEACTIVATED") {
      setAuthStatus("DEACTIVATED");
      if (setStep) setStep("RESTORE_ACCOUNT");
      return;
    }

    if (res.status === "SUCCESS" && user) {
      setAuthUser(user);
      setAuthStatus("AUTHENTICATED");

      // Defining the resumption point for the onboarding tunnel
      const handleNotOnboarded = () => {
        const onboardingTransitData: OnboardingTransitData<"LOGIN"> = {
          _id: "transit:verification",
          purpose: "LOGIN",
          payload: user,
          nextStep: user.onboardingStep
            ? "ONBOARDING_CONTINUATION"
            : "ONBOARDING_INTRO",
        };
        queryClient.setQueryData([CACHE_KEYS.ONBOARDING_TRANSIT_DATA], {
          onboardingTransitData,
        });
        navigateTo(CLIENT_ROUTES.onboarding, { loadPage: true });
      };

      // OTP Verification Flow for stale devices or untrusted hardware
      if (res.requireOtp) {
        const onOtpSuccess = () => {
          if (!user.isOnboarded) {
            handleNotOnboarded();
          } else {
            navigateTo(CLIENT_ROUTES.home, { loadPage: true });
          }
        };

        const otpTransitData: OtpTransitData<"LOGIN"> = {
          _id: "transit:verification",
          identifier,
          channel:
            inputType === "EMAIL" || inputType === "PHONE"
              ? inputType
              : "EMAIL",
          purpose: "LOGIN",
          payload: user,
          reason: res.otpReason,
          onSuccess: onOtpSuccess,
        };

        queryClient.setQueryData([CACHE_KEYS.LOGIN_TRANSIT_DATA], {
          otpTransitData,
        });

        const targetIdentifier = user.email || user.phoneNumber || identifier;

        try {
          await sendOtp({ recipient: targetIdentifier });
          navigateTo(CLIENT_ROUTES.verifyOtp, { loadPage: true });
          return;
        } catch (error) {
          setInlineMsg("Failed to send verification code.");
          return;
        }
      }

      // Handling users who haven't completed onboarding steps
      if (!user.isOnboarded) {
        handleNotOnboarded();
        return;
      }

      // Finalizing redirect for fully verified and onboarded users
      setGlobalLoading(true);
      if (setStep) setStep("IDENTIFIER");

      const savedPage = getFromLocalStorage<IPage>();
      const destination =
        savedPage && !isOnWeb(savedPage.path) ? savedPage : CLIENT_ROUTES.home;

      navigateTo(destination);
    }
  };

  /**
   * Processes authentication failures and manages lockout messaging.
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

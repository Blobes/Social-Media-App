"use client";

import { queryClient } from "@repo/helpers";
import {
  CACHE_KEYS,
  CLIENT_ROUTES,
  IUser,
  OnboardingTransitData,
  OtpTransitData,
  OtpChannel,
  OtpReason,
  InputType,
} from "@repo/core";
import { usePage } from "@repo/shared-hooks";

export const useAuthNavigation = () => {
  const { navigateTo } = usePage();

  /**
   * Prepares and routes user to the onboarding flow.
   */
  const handleNotOnboarded = (user: IUser) => {
    // const onboardingTransitData: OnboardingTransitData<"LOGIN_VERIFICATION"> = {
    //   _id: "transit:onboarding-login",
    //   purpose: "LOGIN_VERIFICATION",
    //   payload: user,
    //   nextStep: user.onboardingStep ? "WELCOME_BACK" : "INTRO",
    // };
    // queryClient.setQueryData(
    //   CACHE_KEYS.ONBOARDING_TRANSIT_DATA,
    //   onboardingTransitData,
    // );
    navigateTo(CLIENT_ROUTES.onboarding, { loadPage: true });
  };

  /**
   * Prepares and routes user to the OTP verification flow.
   */
  const handleOtpRequired = (
    user: IUser,
    identifier: string,
    inputType: InputType,
    reason: OtpReason,
  ) => {
    const activeChannel: OtpChannel =
      inputType === "EMAIL" || inputType === "PHONE" ? inputType : "EMAIL";

    const otpTransitData: OtpTransitData<"LOGIN_VERIFICATION"> = {
      _id: "transit:otp-login",
      identifier,
      channel: activeChannel,
      purpose: "LOGIN_VERIFICATION",
      payload: user,
      reason: reason,
      onVerificationSuccess: () => {
        if (!user.isOnboarded) {
          navigateTo(CLIENT_ROUTES.onboarding, { loadPage: true });
        } else {
          navigateTo(CLIENT_ROUTES.home, { loadPage: true });
        }
      },
    };
    queryClient.setQueryData(CACHE_KEYS.LOGIN_TRANSIT_DATA, otpTransitData);
    navigateTo(CLIENT_ROUTES.verifyOtp, { loadPage: true });
  };

  return { handleNotOnboarded, handleOtpRequired };
};

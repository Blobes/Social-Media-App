"use client";

import { queryClient } from "@repo/helpers";
import {
  CACHE_KEYS,
  CLIENT_ROUTES,
  IUser,
  OtpTransitData,
  OtpChannel,
  OtpReason,
  InputType,
  TransitPurpose,
} from "@repo/core";
import { useGlobalStore, usePage } from "@repo/shared-hooks";

export const useAuthNavigation = () => {
  const { navigateTo } = usePage();
  const setAccountStatus = useGlobalStore((state) => state.setAccountStatus);

  /**
   * Prepares and routes user to the OTP verification flow.
   */
  const handleVerifyOtp = (
    user: IUser,
    identifier: string,
    inputType: InputType,
    reason: OtpReason,
    purpose: TransitPurpose = "LOGIN_VERIFICATION",
    transitKey = CACHE_KEYS.AUTH_TRANSIT_DATA,
  ) => {
    const activeChannel: OtpChannel =
      inputType === "EMAIL" || inputType === "PHONE" ? inputType : "EMAIL";

    const otpTransitData: OtpTransitData<typeof purpose> = {
      _id: "transit:otp-auth",
      identifier,
      channel: activeChannel,
      purpose: purpose,
      payload: user,
      reason: reason,
      onVerificationSuccess: () => {
        if (!user.isOnboarded) {
          setAccountStatus("NOT_ONBOARDED");
          navigateTo(CLIENT_ROUTES.onboarding, { loadPage: true });
        } else {
          setAccountStatus("ACTIVE");
          navigateTo(CLIENT_ROUTES.home, { loadPage: true });
        }
      },
    };
    queryClient.setQueryData(transitKey, otpTransitData);
    navigateTo(CLIENT_ROUTES.verifyOtp, { loadPage: true });
  };

  return { handleVerifyOtp };
};

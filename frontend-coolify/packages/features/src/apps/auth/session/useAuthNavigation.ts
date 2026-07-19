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
import { usePage } from "@repo/shared-hooks";

export interface OtpNavigation {
  user: IUser;
  identifier: string;
  inputType: InputType;
  reason: OtpReason;
  purpose?: TransitPurpose;
  transitKey?: string[];
  method?: OtpChannel;
}

export const useAuthNavigation = () => {
  const { navigateTo } = usePage();

  /**
   * Prepares and routes user to the OTP verification flow.
   */
  const handleOtpNavigation = (navOptions: OtpNavigation) => {
    const {
      user,
      identifier,
      inputType,
      reason,
      purpose = "ACCOUNT_VERIFICATION",
      transitKey = CACHE_KEYS.AUTH_TRANSIT_DATA,
      method,
    } = navOptions;

    const activeChannel: OtpChannel =
      method ??
      (inputType === "EMAIL" || inputType === "PHONE" ? inputType : "EMAIL");

    const otpTransitData: OtpTransitData<typeof purpose> = {
      _id: "transit:otp-auth",
      identifier,
      channel: activeChannel,
      purpose,
      payload: user,
      reason,
    };
    queryClient.setQueryData(transitKey, otpTransitData);
    navigateTo(CLIENT_ROUTES.verifyOtp, { loadPage: true, savePage: false });
  };

  return { handleOtpNavigation };
};

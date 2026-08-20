"use client";

import { useCallback } from "react";
import { queryClient } from "@repo/helpers";
import {
  CACHE_KEYS,
  CLIENT_ROUTES,
  IUser,
  OtpTransitData,
  OtpMessageChannel,
  OtpReason,
  TransitPurpose,
  IdentifierType,
  OtpGeneratorMethod,
} from "@repo/core";
import { usePage } from "@repo/shared-hooks";

export interface OtpNavigation {
  user?: IUser | null;
  identifier?: string;
  inputType?: IdentifierType;
  reason: OtpReason;
  purpose?: TransitPurpose;
  transitKey?: string[];
  otpMessageChannel?: OtpMessageChannel;
  otpGeneratorMethod?: OtpGeneratorMethod;
}

export const useAuthNavigation = () => {
  const { navigateTo } = usePage();

  /**
   * Evaluates if TOTP authenticator mode is available for current user context.
   */
  const checkTotpConfiguration = useCallback(
    (user: IUser | null) =>
      Boolean(user?.hasEnabledMFA) && Boolean(user?.totpAuth?.secret),
    [],
  );

  /**
   * Prepares and routes user to the OTP verification flow.
   */
  const handleOtpNavigation = useCallback(
    (navOptions: OtpNavigation) => {
      const {
        user,
        identifier,
        inputType,
        reason,
        purpose = "LOGIN_VERIFICATION",
        transitKey = CACHE_KEYS.AUTH_TRANSIT_DATA,
        otpMessageChannel,
        otpGeneratorMethod,
      } = navOptions;

      if (!user) return;

      const activeChannel: OtpMessageChannel =
        otpMessageChannel ?? (inputType === "EMAIL" ? "EMAIL" : "WHATSAPP");

      const hasTotp = checkTotpConfiguration(user);

      const otpTransitData: OtpTransitData<typeof purpose> = {
        _id: "transit:otp-auth",
        identifier,
        otpMessageChannel: activeChannel,
        otpGeneratorMethod:
          otpGeneratorMethod ??
          (hasTotp ? "AUTHENTICATOR_APP" : "MESSAGING_APP"),
        purpose,
        payload: user,
        reason,
      };

      queryClient.setQueryData(transitKey, otpTransitData);
      navigateTo(CLIENT_ROUTES.verifyOtp, { loadPage: true });
    },
    [navigateTo, checkTotpConfiguration],
  );

  return { handleOtpNavigation, checkTotpConfiguration };
};

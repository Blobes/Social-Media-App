"use client";

import { useCallback } from "react";
import { queryClient } from "@repo/helpers";
import {
  CLIENT_ROUTES,
  IUser,
  OtpTransitData,
  OtpMessageChannel,
  OtpReason,
  TransitPurpose,
  IdentifierType,
  VerifyIdentityMethod,
  STORAGE_KEYS,
} from "@repo/core";
import { usePage } from "@repo/shared-hooks";

export interface OtpNavigation {
  user?: IUser | null;
  identifier?: string;
  identifierType?: IdentifierType;
  reason: OtpReason;
  purpose?: TransitPurpose;
  transitKey?: readonly string[];
  otpMessageChannel?: OtpMessageChannel;
  verificationMethod?: VerifyIdentityMethod;
  dispatchOnload?: boolean;
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
        identifierType,
        reason,
        purpose = "LOGIN_VERIFICATION",
        transitKey = STORAGE_KEYS.AUTH_TRANSIT,
        otpMessageChannel,
        verificationMethod,
        dispatchOnload,
      } = navOptions;

      if (!user) return;

      const activeChannel: OtpMessageChannel =
        otpMessageChannel ??
        (identifierType === "EMAIL" ? "EMAIL" : "WHATSAPP");

      const hasTotp = checkTotpConfiguration(user);

      const otpTransitData: OtpTransitData<typeof purpose> = {
        _id: transitKey.join("_"),
        identifier,
        otpMessageChannel: activeChannel,
        purpose,
        payload: user,
        reason,
        verificationMethod:
          verificationMethod ?? (hasTotp ? "TOTP" : "MESSAGING"),
        dispatchOnload,
      };

      queryClient.setQueryData(transitKey, otpTransitData);
      navigateTo(CLIENT_ROUTES.verifyIdentity, { loadPage: true });
    },
    [navigateTo, checkTotpConfiguration],
  );

  return { handleOtpNavigation, checkTotpConfiguration };
};

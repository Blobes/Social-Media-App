"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useAuthNavigation } from "@repo/features";
import {
  VerifyIdentityMethod,
  OtpTransitData,
  TransitPurpose,
  useGlobalStore,
} from "@repo/core";

export interface BaseVerificationProps<
  P extends TransitPurpose = TransitPurpose,
> {
  activeTransit?: OtpTransitData<P>;
  onSuccess?: () => void;
  onSwitchMethod?: (targetMethod: VerifyIdentityMethod) => void;
  availableMethods?: VerifyIdentityMethod[];
  onRateLimitExceeded?: () => void;
  isBotChallengeAllowed?: () => boolean;

  setShouldRestrict?: (value: boolean) => void;
  style?: React.CSSProperties;
}

export interface VerifyIdentityProps<
  P extends TransitPurpose = TransitPurpose,
> {
  transitData?: OtpTransitData<P>[];
  initialMethod?: VerifyIdentityMethod;
  onSuccess?: () => void;
  onRateLimitExceeded?: () => void;
  isBotChallengeAllowed?: () => boolean;
  setShouldRestrict?: (value: boolean) => void;
  customMethods?: VerifyIdentityMethod[];
  containerStyle?: React.CSSProperties;
}

export interface UseVerifyIdentityProps<P extends TransitPurpose> {
  transitData?: OtpTransitData<P>[];
  initialMethod?: VerifyIdentityMethod;
  customMethods?: VerifyIdentityMethod[];
  setShouldRestrict?: (value: boolean) => void;
}

/**
 * Manages verification method selection, active transit session evaluation, and security restrictions.
 */
export const useVerifyIdentity = <P extends TransitPurpose>(
  props: UseVerifyIdentityProps<P>,
) => {
  const { transitData, initialMethod, customMethods, setShouldRestrict } =
    props;
  const activeTransit = transitData?.[0];
  const authUser = useGlobalStore((state) => state.authUser);
  const { checkTotpConfiguration } = useAuthNavigation();

  const userHasTotp = checkTotpConfiguration(authUser);

  const hasUserCtx =
    authUser && !authUser.isEmailVerified && !authUser.isPhoneVerified;

  /**
   * Evaluates active transit session validity to update restrict state.
   */
  useEffect(() => {
    const hasValidSession = Boolean(activeTransit || hasUserCtx);
    setShouldRestrict?.(!hasValidSession);
  }, [activeTransit, hasUserCtx, setShouldRestrict]);

  const purpose = activeTransit?.purpose;

  /**
   * Resolves supported root verification methods depending on workflow context.
   */
  const availableMethods = useMemo<VerifyIdentityMethod[]>(() => {
    if (customMethods && customMethods.length > 0) return customMethods;

    // Registration allows only messaging (email)
    if (purpose === "SIGNUP_VERIFICATION") {
      return ["MESSAGING"];
    }

    // MFA Activation allows messaging (SMS/WhatsApp) and TOTP if not yet configured
    if (purpose === "MFA_ACTIVATION") {
      const methods: VerifyIdentityMethod[] = ["MESSAGING"];
      if (!userHasTotp) {
        methods.unshift("TOTP");
      }
      return methods;
    }

    // Login or Password Reset: allow messaging and TOTP if configured
    const methods: VerifyIdentityMethod[] = ["MESSAGING"];
    if (userHasTotp) {
      methods.unshift("TOTP");
    }
    return methods;
  }, [customMethods, purpose, userHasTotp]);

  const defaultMethod = useMemo<VerifyIdentityMethod>(() => {
    if (initialMethod && availableMethods.includes(initialMethod)) {
      return initialMethod;
    }
    if (activeTransit?.verificationMethod === "TOTP" && userHasTotp) {
      return "TOTP";
    }
    return availableMethods[0] || "MESSAGING";
  }, [
    initialMethod,
    availableMethods,
    activeTransit?.verificationMethod,
    userHasTotp,
  ]);

  const [activeMethod, setActiveMethod] =
    useState<VerifyIdentityMethod>(defaultMethod);

  /**
   * Switches active verification strategy if available.
   */
  const switchMethod = useCallback(
    (method: VerifyIdentityMethod) => {
      if (availableMethods.includes(method)) {
        setActiveMethod(method);
      }
    },
    [availableMethods],
  );

  return {
    activeMethod,
    switchMethod,
    availableMethods,
    activeTransit,
  };
};

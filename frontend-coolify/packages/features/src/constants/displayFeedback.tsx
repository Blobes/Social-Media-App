"use client";

import React from "react";
import {
  AUTH_BUTTON_LABELS,
  AUTH_FEEDBACK,
  CLIENT_ROUTES,
  COMMON_BUTTON_LABELS,
  COMMON_FEEDBACK,
} from "@repo/core";
import {
  ShieldCheck,
  Lock,
  Construction,
  Ban,
  ShieldX,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { usePage, useStaticTranslation } from "@repo/shared-hooks";

export type DisplayType =
  | "ALREADY_LOGGED_IN"
  | "UNAUTHORIZED"
  | "MAINTENANCE"
  | "BANNED"
  | "NEEDS_LOGIN"
  | "NEEDS_ONBOARDING"
  | "NEEDS_OTP_VERIFICATION"
  | "NEEDS_RESTORE"
  | "PASSWORD_RESET_SUCCESS";

export interface DisplayConfig {
  headline?: React.ReactNode;
  tagline?: React.ReactNode;
  icon?: React.ReactNode;
  primaryCta?: {
    label: string;
    action: () => void;
    href?: string;
  };
  secondaryCta?: {
    label: string;
    action: () => void;
  };
}

/**
 * Custom hook providing structured configuration contexts for application level restricted views.
 */
export const useDisplayFBConfig = (): Record<DisplayType, DisplayConfig> => {
  const { navigateTo } = usePage();
  const { translateTxtString } = useStaticTranslation();

  return {
    ALREADY_LOGGED_IN: {
      headline: translateTxtString(AUTH_FEEDBACK.already_signed_in_headline),
      tagline: translateTxtString(AUTH_FEEDBACK.already_signed_in_tagline),
      icon: <ShieldCheck size={48} />,
      primaryCta: {
        label: translateTxtString(COMMON_BUTTON_LABELS.go_home),
        action: () =>
          navigateTo(CLIENT_ROUTES.home, { type: "replace", loadPage: true }),
        href: CLIENT_ROUTES.home.path,
      },
    },
    PASSWORD_RESET_SUCCESS: {
      headline: translateTxtString(
        AUTH_FEEDBACK.password_reset_successful_headline,
      ),
      tagline: translateTxtString(
        AUTH_FEEDBACK.password_reset_successful_tagline,
      ),
      icon: <ShieldCheck size={48} />,
      primaryCta: {
        label: AUTH_BUTTON_LABELS.login.tValue,
        action: () => navigateTo(CLIENT_ROUTES.login, { loadPage: true }),
      },
    },
    UNAUTHORIZED: {
      headline: translateTxtString(COMMON_FEEDBACK.access_denied_headline),
      tagline: translateTxtString(COMMON_FEEDBACK.access_denied_tagline),
      icon: <ShieldX size={48} />,
      primaryCta: {
        label: translateTxtString(COMMON_BUTTON_LABELS.go_home),
        action: () => navigateTo(CLIENT_ROUTES.home, { loadPage: true }),
      },
    },
    MAINTENANCE: {
      headline: translateTxtString(COMMON_FEEDBACK.under_maintenance_headline),
      tagline: translateTxtString(COMMON_FEEDBACK.under_maintenance_tagline),
      icon: <Construction size={48} />,
      primaryCta: {
        label: translateTxtString(COMMON_BUTTON_LABELS.go_home),
        action: () => navigateTo(CLIENT_ROUTES.home, { loadPage: true }),
      },
    },
    BANNED: {
      headline: translateTxtString(AUTH_FEEDBACK.account_suspended_headline),
      tagline: translateTxtString(AUTH_FEEDBACK.account_suspended_tagline),
      icon: <Ban size={48} />,
      primaryCta: {
        label: translateTxtString(COMMON_BUTTON_LABELS.view_terms),
        action: () => navigateTo(CLIENT_ROUTES.terms, { loadPage: true }),
      },
    },
    NEEDS_LOGIN: {
      headline: translateTxtString(COMMON_FEEDBACK.access_restricted_headline),
      tagline: translateTxtString(COMMON_FEEDBACK.access_restricted_tagline),
      icon: <Lock size={48} />,
      primaryCta: {
        label: translateTxtString(AUTH_BUTTON_LABELS.login_now),
        action: () => navigateTo(CLIENT_ROUTES.login, { loadPage: true }),
      },
      secondaryCta: {
        label: translateTxtString(AUTH_BUTTON_LABELS.proceed),
        action: () => navigateTo(CLIENT_ROUTES.home, { loadPage: true }),
      },
    },
    NEEDS_OTP_VERIFICATION: {
      headline: translateTxtString(AUTH_FEEDBACK.verify_your_account_headline),
      tagline: translateTxtString(AUTH_FEEDBACK.verify_your_account_tagline),
      icon: <UserPlus size={48} />,
      primaryCta: {
        label: translateTxtString(AUTH_BUTTON_LABELS.otp_verify_code),
        action: () => navigateTo(CLIENT_ROUTES.verifyOtp, { loadPage: true }),
      },
    },
    NEEDS_ONBOARDING: {
      headline: translateTxtString(AUTH_FEEDBACK.finish_setting_up_headline),
      tagline: translateTxtString(AUTH_FEEDBACK.finish_setting_up_tagline),
      icon: <UserPlus size={48} />,
      primaryCta: {
        label: translateTxtString(AUTH_BUTTON_LABELS.resume),
        action: () => navigateTo(CLIENT_ROUTES.onboarding, { loadPage: true }),
      },
    },
    NEEDS_RESTORE: {
      headline: translateTxtString(AUTH_FEEDBACK.account_deactivated_headline),
      tagline: translateTxtString(
        AUTH_FEEDBACK.user_account_deactivated_tagline,
      ),
      icon: <RefreshCw size={48} />,
      primaryCta: {
        label: translateTxtString(AUTH_BUTTON_LABELS.restore_account),
        action: () =>
          navigateTo(CLIENT_ROUTES.restoreAccount, { loadPage: true }),
      },
    },
  };
};

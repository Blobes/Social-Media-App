"use client";

import React from "react";
import {
  AUTH_BUTTON_LABELS,
  AUTH_FEEDBACK,
  CLIENT_ROUTES,
  COMMON_BUTTON_LABELS,
  COMMON_FEEDBACK,
  IPage,
  NavigateOptions,
  TransData,
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

export type RestrictedType =
  | "ALREADY_LOGGED_IN"
  | "UNAUTHORIZED"
  | "MAINTENANCE"
  | "BANNED"
  | "NEEDS_LOGIN"
  | "NEEDS_ONBOARDING"
  | "NEEDS_OTP_VERIFICATION"
  | "NEEDS_RESTORE";

export interface RestrictedConfig {
  headline?: string;
  tagline?: string;
  transData?: TransData;
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
 * Provides structured configuration contexts for application level restricted views.
 */
export const RESTRICTED_CONFIG = (
  navigateTo: (page: IPage, options?: NavigateOptions) => Promise<void>,
): Record<RestrictedType, RestrictedConfig> => {
  return {
    ALREADY_LOGGED_IN: {
      headline: AUTH_FEEDBACK.already_signed_in_headline.tValue,
      tagline: AUTH_FEEDBACK.already_signed_in_tagline.tValue,
      transData: {
        headline: AUTH_FEEDBACK.already_signed_in_headline,
        textDesc: AUTH_FEEDBACK.already_signed_in_tagline,
        primaryBtn: COMMON_BUTTON_LABELS.go_home,
      },
      icon: <ShieldCheck size={48} />,
      primaryCta: {
        label: COMMON_BUTTON_LABELS.go_home.tValue,
        action: () =>
          navigateTo(CLIENT_ROUTES.home, { type: "replace", loadPage: true }),
        href: CLIENT_ROUTES.home.path,
      },
    },
    UNAUTHORIZED: {
      headline: COMMON_FEEDBACK.access_denied_headline.tValue,
      tagline: COMMON_FEEDBACK.access_denied_tagline.tValue,
      transData: {
        headline: COMMON_FEEDBACK.access_denied_headline,
        textDesc: COMMON_FEEDBACK.access_denied_tagline,
        primaryBtn: COMMON_BUTTON_LABELS.go_home,
      },
      icon: <ShieldX size={48} />,
      primaryCta: {
        label: COMMON_BUTTON_LABELS.go_home.tValue,
        action: () => navigateTo(CLIENT_ROUTES.home, { loadPage: true }),
      },
    },
    MAINTENANCE: {
      headline: COMMON_FEEDBACK.under_maintenance_headline.tValue,
      tagline: COMMON_FEEDBACK.under_maintenance_tagline.tValue,
      transData: {
        headline: COMMON_FEEDBACK.under_maintenance_headline,
        textDesc: COMMON_FEEDBACK.under_maintenance_tagline,
        primaryBtn: COMMON_BUTTON_LABELS.go_home,
      },
      icon: <Construction size={48} />,
      primaryCta: {
        label: COMMON_BUTTON_LABELS.go_home.tValue,
        action: () => navigateTo(CLIENT_ROUTES.home, { loadPage: true }),
      },
    },
    BANNED: {
      headline: AUTH_FEEDBACK.account_suspended_headline.tValue,
      tagline: AUTH_FEEDBACK.account_suspended_tagline.tValue,
      transData: {
        headline: AUTH_FEEDBACK.account_suspended_headline,
        textDesc: AUTH_FEEDBACK.account_suspended_tagline,
        primaryBtn: COMMON_BUTTON_LABELS.view_terms,
      },
      icon: <Ban size={48} />,
      primaryCta: {
        label: COMMON_BUTTON_LABELS.view_terms.tValue,
        action: () => navigateTo(CLIENT_ROUTES.terms, { loadPage: true }),
      },
    },
    NEEDS_LOGIN: {
      headline: COMMON_FEEDBACK.access_restricted_headline.tValue,
      tagline: COMMON_FEEDBACK.access_restricted_tagline.tValue,
      transData: {
        headline: COMMON_FEEDBACK.access_restricted_headline,
        textDesc: COMMON_FEEDBACK.access_restricted_tagline,
        primaryBtn: AUTH_BUTTON_LABELS.login_now,
      },
      icon: <Lock size={48} />,
      primaryCta: {
        label: AUTH_BUTTON_LABELS.login_now.tValue,
        action: () => navigateTo(CLIENT_ROUTES.login, { loadPage: true }),
      },
      secondaryCta: {
        label: AUTH_BUTTON_LABELS.proceed.tValue,
        action: () => navigateTo(CLIENT_ROUTES.home, { loadPage: true }),
      },
    },
    NEEDS_OTP_VERIFICATION: {
      headline: AUTH_FEEDBACK.verify_your_account_headline.tValue,
      tagline: AUTH_FEEDBACK.verify_your_account_tagline.tValue,
      transData: {
        headline: AUTH_FEEDBACK.verify_your_account_headline,
        textDesc: AUTH_FEEDBACK.verify_your_account_tagline,
        primaryBtn: AUTH_BUTTON_LABELS.otp_verify_code,
      },
      icon: <UserPlus size={48} />,
      primaryCta: {
        label: AUTH_BUTTON_LABELS.otp_verify_code.tValue,
        action: () => navigateTo(CLIENT_ROUTES.verifyOtp, { loadPage: true }),
      },
    },
    NEEDS_ONBOARDING: {
      headline: AUTH_FEEDBACK.finish_setting_up_headline.tValue,
      tagline: AUTH_FEEDBACK.finish_setting_up_tagline.tValue,
      transData: {
        headline: AUTH_FEEDBACK.finish_setting_up_headline,
        textDesc: AUTH_FEEDBACK.finish_setting_up_tagline,
        primaryBtn: AUTH_BUTTON_LABELS.resume,
      },
      icon: <UserPlus size={48} />,
      primaryCta: {
        label: AUTH_BUTTON_LABELS.resume.tValue,
        action: () => navigateTo(CLIENT_ROUTES.onboarding, { loadPage: true }),
      },
    },
    NEEDS_RESTORE: {
      headline: AUTH_FEEDBACK.account_deactivated_headline.tValue,
      tagline: AUTH_FEEDBACK.user_account_deactivated_tagline.tValue,
      transData: {
        headline: AUTH_FEEDBACK.account_deactivated_headline,
        textDesc: AUTH_FEEDBACK.user_account_deactivated_tagline,
        primaryBtn: AUTH_BUTTON_LABELS.restore_account,
      },
      icon: <RefreshCw size={48} />,
      primaryCta: {
        label: AUTH_BUTTON_LABELS.restore_account.tValue,
        action: () =>
          navigateTo(CLIENT_ROUTES.restoreAccount, { loadPage: true }),
      },
    },
  };
};

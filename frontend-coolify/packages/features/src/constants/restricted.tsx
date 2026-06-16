"use client";

import React from "react";
import { CLIENT_ROUTES, IPage, NavigateOptions } from "@repo/core";
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

export const RESTRICTED_CONFIG = (
  navigateTo: (page: IPage, options?: NavigateOptions) => Promise<void>,
): Record<RestrictedType, RestrictedConfig> => {
  return {
    NEEDS_LOGIN: {
      headline: "Access Restricted",
      tagline:
        "You need to be logged in to view this page. Please sign in to continue.",
      icon: <Lock size={48} />,
      primaryCta: {
        label: "Login Now",
        action: () => navigateTo(CLIENT_ROUTES.login, { loadPage: true }),
      },
      secondaryCta: {
        label: "Go Home",
        action: () => navigateTo(CLIENT_ROUTES.home, { loadPage: true }),
      },
    },
    NEEDS_OTP_VERIFICATION: {
      headline: "Verify your account",
      tagline:
        "You're almost there! Complete your verification process to unlock full access to Funstakes.",
      icon: <UserPlus size={48} />,
      primaryCta: {
        label: "Verify Account",
        action: () => navigateTo(CLIENT_ROUTES.onboarding, { loadPage: true }),
      },
    },
    NEEDS_ONBOARDING: {
      headline: "Finish Setting Up",
      tagline:
        "You're almost there! Complete your profile setup to unlock full access to all features.",
      icon: <UserPlus size={48} />,
      primaryCta: {
        label: "Resume Onboarding",
        action: () => navigateTo(CLIENT_ROUTES.onboarding, { loadPage: true }),
      },
    },
    NEEDS_RESTORE: {
      headline: "Account Deactivated",
      tagline:
        "Your account is currently inactive. Please proceed to the restoration page to recover your access.",
      icon: <RefreshCw size={48} />,
      primaryCta: {
        label: "Restore Account",
        action: () =>
          navigateTo(CLIENT_ROUTES.restoreAccount, { loadPage: true }),
      },
    },
    ALREADY_LOGGED_IN: {
      headline: "You are already signed in",
      tagline: "Return to funstakes.com or logout.",
      icon: <ShieldCheck size={48} />,
      primaryCta: {
        label: "Go to Funstakes.com",
        action: () =>
          navigateTo(CLIENT_ROUTES.home, { type: "replace", loadPage: true }),
        href: CLIENT_ROUTES.home.path,
      },
    },
    UNAUTHORIZED: {
      headline: "Access Denied",
      tagline: "You don't have the permissions required to view this page.",
      icon: <ShieldX size={48} />,
      primaryCta: {
        label: "Go Home",
        action: () => navigateTo(CLIENT_ROUTES.home, { loadPage: true }),
      },
    },
    MAINTENANCE: {
      headline: "Under Maintenance",
      tagline: "We are making improvements. Please check back shortly.",
      icon: <Construction size={48} />,
      primaryCta: {
        label: "Go Home",
        action: () => navigateTo(CLIENT_ROUTES.home, { loadPage: true }),
      },
    },
    BANNED: {
      headline: "Account Restricted",
      tagline: "Your account has been suspended for violating our terms.",
      icon: <Ban size={48} />,
      primaryCta: {
        label: "View Terms",
        action: () => navigateTo(CLIENT_ROUTES.terms, { loadPage: true }),
      },
    },
  };
};

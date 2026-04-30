"use client";

import React, { useMemo } from "react";
import { CLIENT_ROUTES, GenericStyle, IPage } from "@repo/core";
import { ShieldCheck, Lock, Construction, Ban } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { Feedback } from "@repo/shared-ui";
import { usePage } from "@repo/shared-hooks";

export type RestrictedPurpose =
  | "ALREADY_LOGGED_IN"
  | "UNAUTHORIZED"
  | "MAINTENANCE"
  | "BANNED";

export const RESTRICTED_CONFIG: Record<RestrictedPurpose, any> = {
  ALREADY_LOGGED_IN: {
    headline: "You are already signed in",
    tagline: "Return to funstakes.com or logout.",
    icon: <ShieldCheck />,
    primaryLabel: "Go to Funstakes.com",
    primaryPath: CLIENT_ROUTES.home,
    secondaryLabel: "Logout",
  },
  UNAUTHORIZED: {
    headline: "Access Denied",
    tagline: "You don't have the permissions required to view this page.",
    icon: <Lock />,
    primaryLabel: "Go Home",
    primaryPath: CLIENT_ROUTES.home,
    secondaryLabel: "Contact Support",
  },
  MAINTENANCE: {
    headline: "Under Maintenance",
    tagline: "We are making improvements. Please check back shortly.",
    icon: <Construction />,
    primaryLabel: "Go Home",
    primaryPath: CLIENT_ROUTES.home,
    secondaryLabel: "Try Again Later",
  },
  BANNED: {
    headline: "Account Restricted",
    tagline: "Your account has been suspended for violating our terms.",
    icon: <Ban />,
    primaryLabel: "View Terms",
    primaryPath: CLIENT_ROUTES.terms,
    secondaryLabel: "Appeal Decision",
  },
};

interface RestrictedUIProps {
  purpose: RestrictedPurpose;
  customHeadline?: string;
  customTagline?: string;
  showCta?: boolean;
  secondaryCta?: {
    label: string;
    action: () => void;
  };
  style?: GenericStyle;
}
/**
 * A generic UI for restricted access states.
 */
export const RestrictedUI = ({
  purpose,
  customHeadline,
  customTagline,
  secondaryCta,
  showCta = true,
}: RestrictedUIProps) => {
  const theme = useTheme();
  const { navigateTo } = usePage();

  const config = RESTRICTED_CONFIG[purpose];

  const handlePrimaryCta = useMemo(() => {
    if (!showCta) return undefined;
    return {
      label: config.primaryLabel,
      action: () =>
        navigateTo(config.primaryPath, { type: "replace", loadPage: true }),
      href: config.primaryPath.path,
    };
  }, [config.primaryLabel]);

  const handleSecondaryCta = useMemo(() => {
    if (!showCta || !secondaryCta) return undefined;

    return {
      label: secondaryCta.label || config.secondaryLabel,
      action: secondaryCta.action,
    };
  }, [secondaryCta?.action, secondaryCta?.label, config.secondaryLabel]);

  return (
    <Feedback
      headline={customHeadline ?? config.headline}
      tagline={customTagline ?? config.tagline}
      icon={config.icon}
      style={{
        container: {
          padding: theme.boxSpacing(18),
          backgroundColor: theme.palette.gray[0],
          border: `1px solid ${theme.fixedColors.pTrans}`,
        },
        tagline: { color: theme.palette.gray[200] },
        primaryCta: { width: "100%", paddingY: 4 },
        icon: { width: "40px", height: "40px" },
      }}
      primaryCta={handlePrimaryCta}
      secondaryCta={handleSecondaryCta}
    />
  );
};

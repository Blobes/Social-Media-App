"use client";

import React from "react";
import { IconButton, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AppButton } from "./Buttons";
import { RefreshCcw } from "lucide-react";
import { BasicTooltip } from "./Tooltips";
import { GenericStyle } from "@repo/core";
import { TransText } from "./Text";

interface CTA {
  type?: "BUTTON" | "ICON";
  variant?: "contained" | "outlined";
  label?: React.ReactNode;
  toolTip?: string;
  action: () => void | Promise<void>;
  href?: string;
}

interface FeedbackProps {
  headline?: React.ReactNode;
  tagline?: React.ReactNode;
  icon?: React.ReactNode;
  style?: {
    container?: GenericStyle;
    headline?: GenericStyle;
    tagline?: GenericStyle;
    icon?: GenericStyle;
    primaryCta?: GenericStyle;
    secondaryCta?: GenericStyle;
  };
  primaryCta?: CTA;
  secondaryCta?: CTA;
}

/**
 * Standardized empty-state, success, and contextual user action feedback layouts.
 */
export const Feedback: React.FC<FeedbackProps> = ({
  headline,
  tagline,
  icon,
  style,
  primaryCta,
  secondaryCta,
}) => {
  const theme = useTheme();

  const primaryCtaType = primaryCta?.type || "BUTTON";
  const secondaryCtaType = secondaryCta?.type || "BUTTON";
  const primHref = primaryCta?.href ? { href: primaryCta?.href } : {};
  const secHref = secondaryCta?.href ? { href: secondaryCta?.href } : {};

  return (
    <Stack
      sx={{
        backgroundColor: theme.palette.gray.trans[1],
        padding: theme.boxSpacing(12, 8),
        textAlign: "center",
        borderRadius: theme.radius[3],
        alignItems: "center",
        justifyContent: "center",
        ...style?.container,
      }}>
      {/* Icon */}
      {icon && (
        <Stack
          sx={{
            width: "32px",
            height: "32px",
            "& svg": {
              width: "100%",
              height: "100%",
              stroke: theme.palette.gray[200],
              strokeWidth: "1.2px",
              fill: "none",
              ...style?.icon?.svg,
            },
            ...style?.icon,
          }}>
          {icon}
        </Stack>
      )}

      {/* Headline */}
      {headline && (
        <TransText
          component="h6"
          sx={{
            ...theme.typography.text2,
            fontWeight: "bold",
            ...style?.headline,
          }}>
          {headline}
        </TransText>
      )}

      {/* Tagline */}
      {tagline && (
        <TransText
          sx={{
            ...theme.typography.text4,
            ...style?.tagline,
          }}>
          {tagline}
        </TransText>
      )}
      {/* CTAs */}
      {primaryCta &&
        (primaryCtaType === "BUTTON" ? (
          <AppButton
            variant={primaryCta.variant || "contained"}
            size="small"
            {...primHref}
            style={{
              margin: theme.boxSpacing(10, 0, 2, 0),
              ...style?.primaryCta,
            }}
            onClick={primaryCta.action}>
            {primaryCta.label}
          </AppButton>
        ) : (
          <BasicTooltip title={primaryCta.toolTip || ""}>
            <IconButton onClick={primaryCta.action} {...primHref}>
              {primaryCta.label || <RefreshCcw />}
            </IconButton>
          </BasicTooltip>
        ))}

      {secondaryCta &&
        (secondaryCtaType === "BUTTON" ? (
          <AppButton
            variant="text"
            size="small"
            onClick={secondaryCta.action}
            {...secHref}
            style={{ ...style?.secondaryCta }}>
            {secondaryCta.label}
          </AppButton>
        ) : (
          <BasicTooltip title={secondaryCta.toolTip || ""}>
            <IconButton onClick={secondaryCta.action} {...secHref}>
              {secondaryCta.label || <RefreshCcw />}
            </IconButton>
          </BasicTooltip>
        ))}
    </Stack>
  );
};

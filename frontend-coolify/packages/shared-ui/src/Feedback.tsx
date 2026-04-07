"use client";

import React from "react";
import { IconButton, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AppButton } from "./Buttons";
import { RefreshCcw } from "lucide-react";
import { BasicTooltip } from "./Tooltips";

interface FeedbackProps {
  headline?: string;
  tagline?: string;
  icon?: React.ReactNode;
  style?: {
    container?: any;
    headline?: any;
    tagline?: any;
    icon?: any;
    primaryCta?: any;
    secondaryCta?: any;
  };
  primaryCta?: {
    type?: "BUTTON" | "ICON";
    variant?: "contained" | "outlined";
    label?: string | React.ReactNode;
    toolTip?: string;
    action: () => void | Promise<void>;
    href?: string;
    isCrossZone?: boolean;
  };
  secondaryCta?: {
    type?: "BUTTON" | "ICON";
    label?: string | React.ReactNode;
    toolTip?: string;
    action: () => void;
    href?: string;
    isCrossZone?: boolean;
  };
}

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
              strokeColor: theme.palette.gray[300],
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
        <Typography
          variant="body1"
          component={"h6"}
          sx={{
            fontWeight: "bold",
            ...style?.headline,
          }}>
          {headline}
        </Typography>
      )}
      {/* Tagline */}
      {tagline && (
        <Typography
          variant="body3"
          sx={{
            ...style?.tagline,
          }}>
          {tagline}
        </Typography>
      )}
      {/* CTAs */}
      {primaryCta &&
        (primaryCtaType === "BUTTON" ? (
          <AppButton
            variant={primaryCta.variant || "contained"}
            {...primHref}
            style={{
              fontSize: "14px",
              padding: theme.boxSpacing(2, 7),
              margin: theme.boxSpacing(10, 0, 2, 0),
              ...style?.primaryCta,
            }}
            onClick={primaryCta.action}>
            {primaryCta.label || "Start"}
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
            onClick={secondaryCta.action}
            {...secHref}
            style={{ padding: theme.boxSpacing(2, 6), ...style?.secondaryCta }}>
            {secondaryCta.label || "Start"}
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

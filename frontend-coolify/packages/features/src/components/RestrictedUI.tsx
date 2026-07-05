"use client";

import React, { useMemo } from "react";
import { GenericStyle } from "@repo/core";
import { useTheme } from "@mui/material/styles";
import { Feedback } from "@repo/shared-ui";
import {
  RESTRICTED_CONFIG,
  RestrictedConfig,
  RestrictedType,
} from "../constants/restricted";
import { usePage } from "@repo/shared-hooks";

interface RestrictedUIProps extends RestrictedConfig {
  type: RestrictedType;
  showCta?: boolean;
  style?: GenericStyle;
}
/**
 * A generic UI for restricted access states.
 */
export const RestrictedUI = ({
  type,
  headline,
  tagline,
  primaryCta,
  secondaryCta,
  showCta = true,
}: RestrictedUIProps) => {
  const theme = useTheme();
  const { navigateTo } = usePage();

  const config: RestrictedConfig = RESTRICTED_CONFIG(navigateTo)[type];

  const handlePrimaryCta = useMemo(() => {
    if (!showCta) return undefined;
    return primaryCta ?? config.primaryCta;
  }, [config.primaryCta, primaryCta]);

  const handleSecondaryCta = useMemo(() => {
    if (!showCta || (!secondaryCta && !config.secondaryCta)) return undefined;
    return secondaryCta ?? config.secondaryCta;
  }, [config.secondaryCta, secondaryCta]);

  return (
    <Feedback
      transData={{
        headline: config.transData?.headline,
        textDesc: config.transData?.textDesc,
        primaryBtn: config.transData?.primaryBtn,
      }}
      headline={headline ?? config.headline}
      tagline={tagline ?? config.tagline}
      icon={config.icon}
      style={{
        container: {
          padding: theme.boxSpacing(18),
          backgroundColor: theme.palette.gray[0],
          border: `1px solid ${theme.fixedColors.pTrans}`,
        },
        tagline: { color: theme.palette.gray[200] },
        primaryCta: { paddingY: theme.boxSpacing(2) },
        icon: {
          width: "50px",
          height: "50px",
          svg: {
            stroke: theme.palette.primary.dark,
            strokeWidth: "1.5px",
          },
        },
      }}
      primaryCta={handlePrimaryCta}
      secondaryCta={handleSecondaryCta}
    />
  );
};

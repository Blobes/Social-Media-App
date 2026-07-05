"use client";

import React from "react";
import { CircularProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { RootUIContainer } from "./Containers";
import { GenericStyle, ITranslation } from "@repo/core";
import { asset } from "@repo/assets";
import { SVGWrapper } from "./SvgWrapper";
import { TransText } from "./Text";

interface ProgressProps extends ITranslation {
  style?: GenericStyle;
  otherProps?: any;
  info?: string;
  value?: number;
  variant?: "determinate" | "indeterminate";
}

/**
 * Renders a standardized circular loading indicator with dynamic typography support.
 */
export const ProgressIcon = ({
  style,
  otherProps,
  info,
  tKey,
  tValue,
  interpolations,
  value,
  variant,
}: ProgressProps) => {
  const theme = useTheme();

  const typographyStyle = {
    textAlign: "center",
    fontWeight: "500",
    fontStyle: "italic",
  };

  return (
    <>
      <CircularProgress
        enableTrackSlot
        variant={variant}
        value={value}
        sx={{ color: theme.fixedColors.primary, ...style }}
        {...otherProps}
        thickness={2.5}
        aria-label="Loading…"
      />
      {info && (
        <TransText
          tKey={tKey}
          tValue={tValue}
          interpolations={interpolations}
          sx={{ ...theme.typography.body2, ...(typographyStyle as any) }}
        />
      )}
    </>
  );
};

export const PageLoaderUI = () => {
  return (
    <RootUIContainer
      style={{
        alignItems: "center",
        justifyContent: "center",
      }}>
      <SVGWrapper src={asset.LoadingAnimation} size={56} preserveColor={true} />
    </RootUIContainer>
  );
};

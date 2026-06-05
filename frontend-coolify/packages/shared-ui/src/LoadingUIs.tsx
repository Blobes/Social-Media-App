"use client";

import React from "react";
import { CircularProgress, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { RootUIContainer } from "./Containers";
import { GenericStyle } from "@repo/core";
import { asset } from "@repo/assets";
import { SVGWrapper } from "./SvgWrapper";

interface ProgressProps {
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
  value,
  variant,
}: ProgressProps) => {
  const theme = useTheme();
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
        <Typography
          variant="body2"
          sx={{
            textAlign: "center",
            fontWeight: "500",
            fontStyle: "italic",
          }}>
          {info}
        </Typography>
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

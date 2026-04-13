"use client";

import React from "react";
import { CircularProgress, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { img } from "@repo/assets";
import Image from "next/image";
import { fadeIn, rotate } from "@repo/helpers";
import { AnimatedWrapper } from "./AnimatedWrapper";
import { RootUIContainer } from "./Containers";
import { GenericStyle } from "@repo/core";

interface ProgressProps {
  style?: GenericStyle;
  otherProps?: any;
  info?: string;
}

export const ProgressIcon = ({ style, otherProps, info }: ProgressProps) => {
  const theme = useTheme();
  return (
    <>
      <CircularProgress
        enableTrackSlot
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
  const theme = useTheme();
  return (
    <RootUIContainer
      style={{
        alignItems: "center",
        justifyContent: "center",
      }}>
      <AnimatedWrapper
        sx={{
          borderRadius: theme.radius.full,
          animation: `${rotate} 1s linear infinite forwards`,
        }}>
        <Image src={img.logo} alt="Loading icon" width={54} height={54} />
      </AnimatedWrapper>
    </RootUIContainer>
  );
};

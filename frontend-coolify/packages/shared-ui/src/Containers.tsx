"use client";

import React from "react";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { autoScroll, scrollBarStyle } from "@repo/helpers";
import { GenericStyle } from "@repo/core";

interface UIProps {
  children: React.ReactNode;
  style?: GenericStyle;
  shouldScroll?: boolean;
}
export const RootUIContainer = ({
  children,
  style,
  shouldScroll = false,
}: UIProps) => {
  const theme = useTheme();

  const combinedStyle: GenericStyle = {
    position: "fixed",
    height: "100svh",
    width: "100%",
    gap: 0,
    backgroundColor: theme.palette.gray?.[0],
    ...(shouldScroll && {
      ...autoScroll().base,
      ...scrollBarStyle(theme),
    }),
    ...style,
  };

  return <Stack sx={combinedStyle}>{children}</Stack>;
};

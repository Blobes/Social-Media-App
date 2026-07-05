"use client";

import React, { useEffect } from "react";
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

  useEffect(() => {
    document.documentElement.classList.add("hydrated");
    document.documentElement.style.removeProperty("background-color");
  }, []);

  const combinedStyle: GenericStyle = {
    position: "fixed",
    height: "100svh",
    width: "100%",
    gap: 0,
    backgroundColor: "var(--app-bg)",
    ".hydrated &": {
      backgroundColor: `${theme.palette.gray[0]} !important`,
    },
    ...(shouldScroll && {
      ...autoScroll().base,
      ...scrollBarStyle(theme),
    }),
    ...style,
  };

  return <Stack sx={combinedStyle}>{children}</Stack>;
};

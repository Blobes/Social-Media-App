"use client";

import React from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import globalTheme from "./globalTheme";

export function GlobalThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={globalTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

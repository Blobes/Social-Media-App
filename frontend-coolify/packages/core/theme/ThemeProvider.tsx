"use client";

import React, { useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import globalTheme from "./globalTheme";
import { useAccessibilityStore } from "../store/useAccessibilityStore";

/**
 * Root wrapper delivering theme design tokens and updating user preference properties.
 */
export function GlobalThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const fontScale = useAccessibilityStore((state) => state.fontScale);
  const setPreferences = useAccessibilityStore((state) => state.setPreferences);

  useEffect(() => {
    // Sync current preference parameters to root DOM on mount
    setPreferences({ fontScale });
  }, [fontScale, setPreferences]);

  return (
    <ThemeProvider theme={globalTheme} defaultMode="system">
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

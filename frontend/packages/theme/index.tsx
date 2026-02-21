"use client";

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from "@mui/material/CssBaseline";
import { getThemeConfig } from './theme';
import { useMemo } from 'react';

export function GlobalThemeProvider({
  children,
  initialMode = 'light'
}: {
  children: React.ReactNode;
  initialMode?: 'light' | 'dark';
}) {
  // We initialize the theme based on the server-side cookie value
  const theme = useMemo(() => getThemeConfig(initialMode), [initialMode]);

  return (
    <ThemeProvider theme={theme} defaultMode={initialMode} modeStorageKey="app-theme-mode">
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
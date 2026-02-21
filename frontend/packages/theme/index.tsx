"use client";

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from "@mui/material/CssBaseline";
import theme from './theme';
import { useMemo } from 'react';


export function GlobalThemeProvider({
  children,
  initialMode = 'dark'
}: {
  children: React.ReactNode;
  initialMode?: 'light' | 'dark';
}) {
  // We initialize the theme based on the server-side cookie value
  // const theme = useMemo(() => getThemeConfig(initialMode), [initialMode]);

  return (
    <ThemeProvider theme={theme || initialMode}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
"use client";

import { useColorScheme, useTheme } from "@mui/material/styles";
import {
  Stack,
  Typography,
  Button,
} from "@mui/material";
import React from "react";

export const ThemeSwitcher: React.FC = () => {
  const { mode, setMode } = useColorScheme();

  // Update theme mode
  const updateThemeMode = () => {
    if (mode === "system") setMode("dark");
    else if (mode === "dark") setMode("light");
    else setMode("system");
  };

  return (
    <Stack>
      <Button variant="outlined" onClick={updateThemeMode}>
        Click Me
      </Button>
      <select
        value={mode}
        onChange={(event) => {
          setMode(event.target.value as "light" | "dark" | "system");
          // For TypeScript, cast `event.target.value as 'light' | 'dark' | 'system'`:
        }}>
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </Stack>
  );
};

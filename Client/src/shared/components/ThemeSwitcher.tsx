"use client";

import { useColorScheme, useTheme } from "@mui/material/styles";
import { Stack, Typography, Button, Box, FormLabel } from "@mui/material";
import React from "react";

export const ThemeSwitcher: React.FC = () => {
  const { mode, setMode } = useColorScheme();
  const theme = useTheme();
  const availableModes = ["system", "light", "dark"];

  return (
    <Stack
      role="radiogroup"
      aria-label="Display mode"
      direction="row"
      justifyContent={"flex-end"}
      gap={theme.gap(4)}
      sx={{
        backgroundColor: theme.palette.gray[50],
        borderTop: `1px solid ${theme.palette.gray.trans[2]}`,
        padding: `0px ${theme.boxSpacing(5)}`,
      }}>
      {availableModes.map((value, index) => (
        <FormLabel
          key={value}
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            cursor: "pointer",
            gap: theme.boxSpacing(2),
          }}>
          <input
            type="radio"
            name="mode"
            value={value}
            checked={mode === value}
            onChange={() => setMode(value as "light" | "dark" | "system")}
            style={{ margin: 0, width: "12px" }}
          />
          <Typography
            variant="body3"
            sx={{
              marginRight: `${
                index === availableModes.length - 1 ? 0 : theme.boxSpacing(2)
              }`,
            }}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </Typography>
          <Typography variant="body3">
            {`${index === availableModes.length - 1 ? "" : "|"}`}
          </Typography>
        </FormLabel>
      ))}
    </Stack>
  );
};

{
  /* 
    // Update theme mode
  const updateThemeMode = () => {
    if (mode === "system") setMode("dark");
    else if (mode === "dark") setMode("light");
    else setMode("system");
  };

  
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
</select> */
}

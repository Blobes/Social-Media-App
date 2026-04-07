"use client";

import React from "react";
import { useColorScheme, useTheme } from "@mui/material/styles";
import { Stack, Typography } from "@mui/material";
import { BasicTooltip } from "./Tooltips";
import { MoonStar, Sun } from "lucide-react";

export const ThemeSwitcher: React.FC = () => {
  const { mode, systemMode, setMode } = useColorScheme();
  const theme = useTheme();
  const effectiveMode = mode === "system" ? (systemMode ?? "dark") : mode;

  const toggleMode = () => {
    setMode(effectiveMode === "dark" ? "light" : "dark");
  };

  return (
    <Stack direction="row" alignItems="center">
      <Stack
        sx={{
          width: "100%",
          flexDirection: "row",
          gap: theme.gap(10),
          alignItems: "center",
          "& svg": { width: "22px", height: "22px" },
        }}>
        {effectiveMode === "dark" ? <MoonStar /> : <Sun />}
        <Typography variant="body2" sx={{ fontWeight: "600" }}>
          {effectiveMode === "dark" ? "Dark theme" : "Light theme"}
        </Typography>
      </Stack>

      {/* Switcher */}
      <Stack
        role="switch"
        aria-checked={effectiveMode === "dark"}
        onClick={toggleMode}
        sx={{
          width: 48,
          padding: theme.boxSpacing(1),
          borderRadius: theme.radius.full,
          backgroundColor: theme.palette.gray.trans[1],
          border: `1px solid ${theme.palette.gray.trans[1]}`,
          cursor: "pointer",
          flex: "none",
          alignItems: "center",
          justifyContent: "center",
          "&:hover": {
            backgroundColor: theme.palette.gray.trans[2],
          },
        }}>
        {/* THUMB */}
        <Stack
          sx={{
            width: 26,
            height: 26,
            borderRadius: theme.radius.full,
            backgroundColor: theme.palette.gray[0],
            padding: theme.boxSpacing(2),
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 200ms cubic-bezier(0.4, 0, 0.2, 1)",
            transform:
              effectiveMode === "dark" ? "translateX(8px)" : "translateX(-8px)",
            "& svg": {
              width: "100%",
              height: "100%",
            },
          }}>
          <BasicTooltip
            title={effectiveMode === "dark" ? "Dark Theme" : "Light Theme"}>
            {effectiveMode === "dark" ? <MoonStar /> : <Sun />}
          </BasicTooltip>
        </Stack>
      </Stack>
    </Stack>
  );
};

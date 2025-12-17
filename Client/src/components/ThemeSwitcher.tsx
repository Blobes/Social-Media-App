"use client";

import { useColorScheme, useTheme } from "@mui/material/styles";
import { Stack } from "@mui/material";
import React from "react";
import { DarkMode, DesktopMac, LightMode } from "@mui/icons-material";
import { BasicTooltip } from "./Tooltips";

export const ThemeSwitcher: React.FC = () => {
  const { mode, setMode } = useColorScheme();
  const theme = useTheme();
  const availableModes = ["system", "light", "dark"] as const;

  const updateMode = () => {
    const currentIndex = availableModes.indexOf(mode || "system");
    const nextIndex = (currentIndex + 1) % availableModes.length;
    setMode(availableModes[nextIndex]);
  };

  return (
    <Stack
      role="radiogroup"
      aria-label="Display mode"
      onClick={updateMode}
      sx={{
        backgroundColor: theme.palette.gray.trans[1],
        alignItems: "center",
        justifyContent: "center",
        padding: theme.boxSpacing(3),
        cursor: "pointer",
        borderRadius: theme.radius.full,
        width: "38px",
        height: "38px",
        "&:hover": {
          backgroundColor: theme.palette.gray.trans[2],
        },
      }}>
      {mode === "dark" ? (
        <BasicTooltip title={"Dark Mode"}>
          <DarkMode sx={{ width: "100%", height: "100%" }} />
        </BasicTooltip>
      ) : mode === "light" ? (
        <BasicTooltip title={"Light Mode"}>
          <LightMode sx={{ width: "100%", height: "100%" }} />
        </BasicTooltip>
      ) : (
        <BasicTooltip title={"System Mode"}>
          <DesktopMac sx={{ width: "100%", height: "100%" }} />
        </BasicTooltip>
      )}
    </Stack>
  );
};

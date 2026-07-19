"use client";

import React from "react";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { CircleCheckBig } from "lucide-react";
import { TransText } from "./Text";
import { COMMON_BUTTON_LABELS } from "@repo/core";

export const StatusSwitcher = () => {
  const theme = useTheme();

  return (
    <Stack direction="row" gap={theme.gap(10)} alignItems="center">
      <CircleCheckBig style={{ width: "18px", height: "18px" }} />
      <TransText
        {...COMMON_BUTTON_LABELS.status_switcher}
        sx={{ ...theme.typography.text3, fontWeight: "600" }}
      />
    </Stack>
  );
};

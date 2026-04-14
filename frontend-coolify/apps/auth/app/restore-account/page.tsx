"use client";

import React from "react";
import { useTheme } from "@mui/material/styles";
import { Stack } from "@mui/material";

export default function RestoreAccountPage() {
  const theme = useTheme();

  return (
    <Stack
      sx={{
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        padding: theme.boxSpacing(10),
        minHeight: "fit-content",
      }}>
      Restore Account Page
    </Stack>
  );
}

"use client";

import React from "react";
import { useTheme } from "@mui/material/styles";
import { SignUpStepper } from "./registration/SignupStepper";
import { Stack } from "@mui/material";

export default function SignupPage() {
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
      <SignUpStepper
        style={{
          container: {
            width: "400px",
            padding: theme.boxSpacing(16, 10),
          },
        }}
      />
    </Stack>
  );
}

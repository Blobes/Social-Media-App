"use client";

import { useTheme } from "@mui/material/styles";
import { AuthStepper } from "./AuthStepper";
import { Stack } from "@mui/material";

export default function LoginPage() {
  const theme = useTheme();
  return (
    <Stack
      sx={{
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        padding: theme.boxSpacing(10),
      }}>
      <AuthStepper
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

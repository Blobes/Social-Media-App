"use client";

import { useTheme } from "@mui/material/styles";
import { useAppContext } from "@/app/AppContext";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignUpStepper } from "./SignupStepper";
import { Stack } from "@mui/material";

export default function LoginPage() {
  const theme = useTheme();
  const { loginStatus } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (loginStatus === "AUTHENTICATED") {
      router.replace("/timeline");
    }
  });

  return (
    <Stack
      sx={{
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        padding: theme.boxSpacing(10),
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

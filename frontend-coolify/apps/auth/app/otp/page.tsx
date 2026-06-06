"use client";

import React from "react";
import { useTheme } from "@mui/material/styles";
import { Stack } from "@mui/material";
import { VerifyOtp } from "./VerifyOtp";
import { RestrictedUI } from "@repo/features";
import { useCachedData } from "@repo/shared-hooks";
import { OtpTransitData } from "@repo/core";

export default function OtpPage() {
  const theme = useTheme();
  const cachedEntries = useCachedData<OtpTransitData>(["transit_data"]);

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
      {cachedEntries && cachedEntries.length > 0 ? (
        <VerifyOtp transitData={cachedEntries} />
      ) : (
        <RestrictedUI
          type="UNAUTHORIZED"
          headline="No OTP verification session found"
          tagline="Please return to the home page or the previous page"
        />
      )}
    </Stack>
  );
}

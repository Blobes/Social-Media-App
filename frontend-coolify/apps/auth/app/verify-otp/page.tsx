"use client";

import React from "react";
import { useTheme } from "@mui/material/styles";
import { Stack } from "@mui/material";
import { VerifyOtp } from "./VerifyOtp";
import { RestrictedUI } from "@repo/features";
import { useCachedData } from "@repo/shared-hooks";
import { CACHE_KEYS, OtpTransitData } from "@repo/core";

export default function OtpPage() {
  const theme = useTheme();
  const cachedEntries = useCachedData<OtpTransitData>(
    CACHE_KEYS.LOGIN_TRANSIT_DATA,
  );
  const transitData = cachedEntries[0];

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
      {transitData ? (
        <VerifyOtp transitData={transitData} />
      ) : (
        <RestrictedUI
          purpose="UNAUTHORIZED"
          customHeadline="No OTP verification session found"
          customTagline="Please return to the home page or the previous page"
        />
      )}
    </Stack>
  );
}

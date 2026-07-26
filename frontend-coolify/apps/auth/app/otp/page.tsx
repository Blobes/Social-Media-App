"use client";

import React from "react";
import { useTheme } from "@mui/material/styles";
import { Stack } from "@mui/material";
import { VerifyOtp } from "./VerifyOtp";
import { useCachedData, useStaticTranslation } from "@repo/shared-hooks";
import { AUTH_FEEDBACK, OtpTransitData, TransitPurpose } from "@repo/core";
import { DisplayFeedbackUI } from "@repo/shared-ui";

export default function OtpPage() {
  const theme = useTheme();
  const cachedEntries = useCachedData<OtpTransitData<TransitPurpose>>([
    "transit_data",
  ]);
  const { translateTxtString } = useStaticTranslation();

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
        <DisplayFeedbackUI
          type="UNAUTHORIZED"
          headline={translateTxtString(
            AUTH_FEEDBACK.no_verification_sesion_found,
          )}
          tagline={translateTxtString(AUTH_FEEDBACK.return_home)}
        />
      )}
    </Stack>
  );
}

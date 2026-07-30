"use client";

import React, { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Stack } from "@mui/material";
import { VerifyOtp } from "./VerifyOtp";
import { useCachedData, useStaticTranslation } from "@repo/shared-hooks";
import {
  AUTH_FEEDBACK,
  COMMON_BUTTON_LABELS,
  OtpTransitData,
  TransitPurpose,
} from "@repo/core";
import { DisplayFeedbackUI } from "@repo/shared-ui";
import { useLogout } from "@repo/features";

export default function OtpPage() {
  const theme = useTheme();
  const cachedEntries = useCachedData<OtpTransitData<TransitPurpose>>([
    "transit_data",
  ]);
  const { translateTxtString } = useStaticTranslation();
  const { handleLogout } = useLogout();
  const [shouldRestrict, setShouldRestrict] = useState<boolean>();

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
      {(cachedEntries && cachedEntries.length > 0) || !shouldRestrict ? (
        <VerifyOtp
          transitData={cachedEntries}
          setShouldRestrict={setShouldRestrict}
        />
      ) : (
        <DisplayFeedbackUI
          type="UNAUTHORIZED"
          headline={translateTxtString(
            AUTH_FEEDBACK.no_verification_sesion_found,
          )}
          tagline={translateTxtString(AUTH_FEEDBACK.return_home)}
          primaryCta={{
            label: translateTxtString(COMMON_BUTTON_LABELS.go_home),
            action: handleLogout,
          }}
        />
      )}
    </Stack>
  );
}

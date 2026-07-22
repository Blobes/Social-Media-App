"use client";

import React from "react";
import { useTheme } from "@mui/material/styles";
import { Stack } from "@mui/material";
import { Reset } from "./Reset";
import {
  AUTH_BUTTON_LABELS,
  AUTH_FEEDBACK,
  CLIENT_ROUTES,
  COMMON_BUTTON_LABELS,
  useGlobalStore,
} from "@repo/core";
import { usePage, useStaticTranslation } from "@repo/shared-hooks";
import { DisplayFeedbackUI, usePopup } from "@repo/features";
import { getCookie } from "@repo/helpers";

export default function ResetPage() {
  const authStatus = useGlobalStore((state) => state.authStatus);
  const { translateTxtString } = useStaticTranslation();
  const { openPopup } = usePopup();
  const { navigateTo } = usePage();
  const resetSession = getCookie("reset_session_expiry");
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
      {authStatus === "TEMPORARY" ||
      authStatus === "UNAUTHENTICATED" ||
      resetSession ? (
        <Reset />
      ) : (
        <DisplayFeedbackUI
          type="UNAUTHORIZED"
          headline={translateTxtString(
            AUTH_FEEDBACK.password_reset_not_allowed_headline,
          )}
          tagline={translateTxtString(
            AUTH_FEEDBACK.password_reset_not_allowed_tagline,
          )}
          primaryCta={{
            label: translateTxtString(AUTH_BUTTON_LABELS.logout),
            action: () => openPopup("CONFIRM_LOGOUT"),
          }}
          secondaryCta={{
            label: translateTxtString(COMMON_BUTTON_LABELS.go_home),
            action: () => navigateTo(CLIENT_ROUTES.home, { loadPage: true }),
          }}
        />
      )}
    </Stack>
  );
}

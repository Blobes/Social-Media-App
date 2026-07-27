"use client";

import React from "react";
import { Stack, useTheme } from "@mui/material";
import { applyBGPattern } from "@repo/helpers";
import { Onboarding } from "./Onboarding";
import { AUTH_FEEDBACK, useGlobalStore } from "@repo/core";
import { useStaticTranslation } from "@repo/shared-hooks";
import { DisplayFeedbackUI } from "@repo/shared-ui";

export default function OnboardingPage() {
  const theme = useTheme();
  const authUser = useGlobalStore((state) => state.authUser);
  const { translateTxtString } = useStaticTranslation();

  return (
    <Stack
      sx={{
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        padding: theme.boxSpacing(14),
        [theme.breakpoints.down("sm")]: {
          padding: theme.boxSpacing(2),
        },
        minHeight: "fit-content",
        ...applyBGPattern(),
      }}>
      {authUser?.isOnboarded ? (
        <DisplayFeedbackUI
          type="UNAUTHORIZED"
          headline={translateTxtString(
            AUTH_FEEDBACK.no_required_onboarding_headline,
          )}
          tagline={translateTxtString(
            AUTH_FEEDBACK.no_required_onboarding_tagline,
          )}
        />
      ) : (
        <Onboarding />
      )}
    </Stack>
  );
}

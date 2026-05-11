"use client";

import React from "react";
import { Stack, useTheme } from "@mui/material";
import { useGlobalStore } from "@repo/shared-hooks";
import { applyBGPattern } from "@repo/helpers";
import { Onboarding } from "./Onboarding";
import { RestrictedUI } from "@repo/features";

export default function OnboardingPage() {
  const theme = useTheme();
  const authUser = useGlobalStore((state) => state.authUser);

  return (
    <Stack
      sx={{
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        padding: theme.boxSpacing(6),
        minHeight: "100vh",
        ...applyBGPattern(),
      }}>
      {authUser?.isOnboarded ? (
        <RestrictedUI
          type="UNAUTHORIZED"
          headline="No Required Onboarding"
          tagline="You have already completed the onboarding step."
        />
      ) : (
        <Onboarding
          style={{
            container: {
              width: "450px",
              padding: theme.boxSpacing(18, 16),
              backgroundColor: theme.palette.gray[0],
              boxShadow: theme.shadows[1],
              [theme.breakpoints.down("sm")]: {
                width: "100%",
                padding: theme.boxSpacing(16, 10),
              },
            },
          }}
        />
      )}
    </Stack>
  );
}

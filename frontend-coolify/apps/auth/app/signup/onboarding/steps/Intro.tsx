"use client";

import React, { useCallback } from "react";
import { Stack, Typography, useTheme } from "@mui/material";
import { StepperProps } from "../../../types";
import Image from "next/image";
import { img } from "@repo/assets";
import { AppButton } from "@repo/shared-ui";

/**
 * First step of onboarding providing context and a way to start the process.
 */
export const OnboardingIntro: React.FC<StepperProps> = ({ onNext }) => {
  const theme = useTheme();

  // Memoize navigation to next step
  const handleStart = useCallback(() => {
    if (onNext) onNext();
  }, [onNext]);

  return (
    <Stack
      sx={{
        alignItems: "center",
        textAlign: "center",
        gap: theme.gap(20),
        width: "100%",
        maxWidth: "400px",
      }}>
      <Stack sx={{ alignItems: "center", gap: theme.gap(12) }}>
        <Image
          alt="Welcome"
          src={img.logo} // Or a specific welcome illustration if available
          width={120}
          height={120}
          style={{ borderRadius: theme.radius.full }}
        />

        <Stack sx={{ gap: theme.gap(4) }}>
          <Typography variant="h4" fontWeight={700}>
            Welcome to Funstakes
          </Typography>
          <Typography variant="body1" color={theme.palette.gray[300]}>
            We're excited to have you here. Let's get your profile set up so you
            can start exploring and winning.
          </Typography>
        </Stack>
      </Stack>

      <AppButton
        variant="contained"
        onClick={handleStart}
        style={{ width: "100%", py: 1.5 }}>
        Get Started
      </AppButton>

      <Typography variant="caption" color={theme.palette.gray[200]}>
        It only takes a few minutes to set up your account.
      </Typography>
    </Stack>
  );
};

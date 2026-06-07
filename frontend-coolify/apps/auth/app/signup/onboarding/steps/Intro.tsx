"use client";

import React, { useCallback } from "react";
import { Divider, Stack, Typography, useTheme } from "@mui/material";
import { asset } from "@repo/assets";
import { AppButton, SVGWrapper } from "@repo/shared-ui";
import { AuthStepName, StepperProps } from "@repo/core";
import { Logout } from "@repo/features";

/**
 * First step of onboarding providing context and a way to start the process.
 */
export const OnboardingIntro: React.FC<StepperProps<AuthStepName>> = ({
  onNext,
}) => {
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
        <SVGWrapper
          src={asset.Illustration2}
          size={140}
          preserveColor={true}
          // sx={{
          //   [theme.breakpoints.down("md")]: {
          //     width: 28,
          //     height: 28,
          //   },
          // }}
        />

        <Stack sx={{ gap: theme.gap(4) }}>
          <Typography variant="h4" fontWeight={700}>
            Welcome Aboard Funstaker!
          </Typography>
          <Typography variant="body2" color={theme.palette.gray[200]}>
            Nice to have you here. Let's get your profile set up so you can
            start exploring and winning.
          </Typography>
        </Stack>
      </Stack>

      <AppButton
        variant="contained"
        onClick={handleStart}
        style={{
          fontSize: "16px",
          padding: theme.boxSpacing(5.5, 9),
          width: "100%",
        }}>
        Get Started
      </AppButton>

      {/* Footer */}
      <Divider sx={{ width: "100%" }} />
      <Typography variant="caption" color={theme.palette.gray[200]}>
        It only takes a few minutes to set up your account.
      </Typography>
      <Logout
        containerStyle={{
          gap: theme.gap(4),
          hover: {
            "& svg": { stroke: theme.palette.primary.dark },
          },
        }}
        textStyle={{
          width: "fit-content",
          textAlign: "center",
          color: theme.palette.gray[200],
        }}
        iconStyle={{ size: 18 }}
      />
    </Stack>
  );
};

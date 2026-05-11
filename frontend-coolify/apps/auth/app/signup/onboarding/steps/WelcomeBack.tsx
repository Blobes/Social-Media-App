"use client";

import React, { useCallback } from "react";
import { Stack, Typography, useTheme } from "@mui/material";
import Image from "next/image";
import { img } from "@repo/assets";
import { AppButton } from "@repo/shared-ui";
import { useGlobalStore } from "@repo/shared-hooks";

/**
 * Resume point for returning users who haven't finished onboarding.
 */
export const WelcomeBack: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const theme = useTheme();
  const authUser = useGlobalStore((state) => state.authUser);

  // Memoize navigation to the last saved milestone
  const handleResume = useCallback(() => {
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
          alt="Welcome Back"
          src={img.logo}
          width={120}
          height={120}
          style={{ borderRadius: theme.radius.full }}
        />

        <Stack sx={{ gap: theme.gap(4) }}>
          <Typography variant="h4" fontWeight={700}>
            Welcome back, {authUser?.firstName || "there"}!
          </Typography>
          <Typography variant="body1" color={theme.palette.gray[300]}>
            It looks like you didn't finish setting up your account. Pick up
            right where you left off to get started with Funstakes.
          </Typography>
        </Stack>
      </Stack>

      <AppButton
        variant="contained"
        onClick={handleResume}
        style={{ width: "100%", py: 1.5 }}>
        Continue Setup
      </AppButton>

      <Typography variant="caption" color={theme.palette.gray[200]}>
        Your progress has been saved.
      </Typography>
    </Stack>
  );
};

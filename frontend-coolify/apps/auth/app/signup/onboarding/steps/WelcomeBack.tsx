"use client";

import React, { useCallback } from "react";
import { Stack, Typography, useTheme } from "@mui/material";
import Image from "next/image";
import { asset } from "@repo/assets";
import { AppButton, TransText } from "@repo/shared-ui";
import {
  AUTH_BUTTON_LABELS,
  AUTH_FEEDBACK,
  COMMON_FEEDBACK,
  useGlobalStore,
} from "@repo/core";

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
          src={asset.logo}
          width={120}
          height={120}
          style={{ borderRadius: theme.radius.full }}
        />

        <Stack sx={{ gap: theme.gap(4) }}>
          <TransText
            {...COMMON_FEEDBACK.welcome_back(
              authUser?.firstName || "Funstaker",
            )}
            sx={{ ...theme.typography.h4 }}
          />
          <TransText
            {...AUTH_FEEDBACK.resume_account_setup}
            sx={{ ...theme.typography.body1, color: theme.palette.gray[300] }}
          />
        </Stack>
      </Stack>
      <AppButton
        variant="contained"
        onClick={handleResume}
        style={{ width: "100%", py: 1.5 }}>
        <TransText {...AUTH_BUTTON_LABELS.resume} noComponent />
      </AppButton>
      <TransText
        {...COMMON_FEEDBACK.progress_saved}
        sx={{ ...theme.typography.caption, color: theme.palette.gray[200] }}
      />
    </Stack>
  );
};

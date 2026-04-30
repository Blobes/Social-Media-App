"use client";

import React, { useEffect } from "react";
import { useTheme } from "@mui/material";
import { Feedback } from "./Feedback";
import { Unplug } from "lucide-react";
import { ProgressIcon } from "./LoadingUIs";
import { RootUIContainer } from "./Containers";

interface Props {
  checkingSignal: boolean;
  isUnstableNetwork: boolean;
}

const AUTO_REFRESH_MS = 2 * 60 * 1000;

export const NetworkGlitchUI = ({
  checkingSignal,
  isUnstableNetwork,
}: Props) => {
  const theme = useTheme();

  useEffect(() => {
    const refreshTimer = window.setTimeout(() => {
      window.location.reload();
    }, AUTO_REFRESH_MS);

    return () => window.clearTimeout(refreshTimer);
  }, []);

  return (
    <RootUIContainer
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: theme.gap(30),
      }}>
      {isUnstableNetwork && checkingSignal ? (
        <ProgressIcon
          otherProps={{ size: "30px" }}
          info="Retrieving connection..."
        />
      ) : (
        <Feedback
          headline="Oops, something went wrong"
          tagline="Check your internet connection. We'll retry automatically in a few minutes."
          icon={<Unplug />}
          primaryCta={{
            label: "Refresh",
            variant: "outlined",
            action: () => window.location.reload(),
          }}
          style={{
            container: {
              padding: theme.boxSpacing(16),
              background: "none",
              [theme.breakpoints.up("md")]: {
                maxWidth: "40%",
              },
            },
            tagline: { color: theme.palette.gray[200] },
            icon: {
              width: "60px",
              height: "60px",
              marginBottom: theme.boxSpacing(10),
            },
          }}
        />
      )}
    </RootUIContainer>
  );
};

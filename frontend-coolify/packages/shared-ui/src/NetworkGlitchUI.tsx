"use client";

import React, { useEffect } from "react";
import { useTheme } from "@mui/material";
import { Feedback } from "./Feedback";
import { Unplug } from "lucide-react";
import { ProgressIcon } from "./LoadingUIs";
import { RootUIContainer } from "./Containers";
import { COMMON_BUTTON_LABELS, COMMON_FEEDBACK } from "@repo/core";
import { useStaticTranslation } from "@repo/shared-hooks";

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
  const { translateTxtString } = useStaticTranslation();

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
          tKey={COMMON_FEEDBACK.retrieving_connection.tKey}
          info={COMMON_FEEDBACK.retrieving_connection.tValue}
        />
      ) : (
        <Feedback
          headline={translateTxtString(COMMON_FEEDBACK.network_glitch_headline)}
          tagline={translateTxtString(COMMON_FEEDBACK.network_glitch_tagline)}
          icon={<Unplug />}
          primaryCta={{
            label: translateTxtString(COMMON_BUTTON_LABELS.refresh),
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
            tagline: { color: theme.palette.gray[200], textAlign: "center" },
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

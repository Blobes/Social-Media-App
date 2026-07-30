"use client";

import React from "react";
import { useTheme } from "@mui/material/styles";
import { ScreenShareOff } from "lucide-react";
import { RootUIContainer } from "./Containers";
import { DisplayFeedbackUI } from "./Feedback";
import { COMMON_BUTTON_LABELS, COMMON_FEEDBACK } from "@repo/core";
import { useStaticTranslation } from "@repo/shared-hooks";

interface offlineProps {
  handleOffline: () => void;
}

export const OfflinePromptUI = ({ handleOffline }: offlineProps) => {
  const theme = useTheme();
  const { translateTxtString } = useStaticTranslation();

  return (
    <RootUIContainer
      style={{
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minHeight: "fit-content",
        padding: theme.boxSpacing(12),
        gap: theme.gap(6),
      }}>
      <DisplayFeedbackUI
        type="NETWORK_GLITCH"
        headline={translateTxtString(
          COMMON_FEEDBACK.seem_to_be_offline_headline,
        )}
        tagline={translateTxtString(COMMON_FEEDBACK.seem_to_be_offline_tagline)}
        icon={<ScreenShareOff />}
        primaryCta={{
          type: "BUTTON",
          variant: "outlined",
          label: translateTxtString(COMMON_BUTTON_LABELS.switch_mode),
          action: () => handleOffline(),
        }}
        style={{
          headline: { ...theme.typography.h6, textAlign: "center" },
        }}
      />
    </RootUIContainer>
  );
};

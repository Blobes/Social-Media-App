"use client";

import React from "react";
import { useTheme } from "@mui/material/styles";
import { ScreenShareOff } from "lucide-react";
import { RootUIContainer } from "./Containers";
import { Feedback } from "./Feedback";
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
      <Feedback
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
          container: {
            height: "100%",
            backgroundColor: "none",
          },
          headline: { ...theme.typography.h6 },
          tagline: { ...theme.typography.text4 },
          icon: {
            width: "60px",
            height: "60px",
            marginBottom: theme.boxSpacing(8),
            svg: {
              fill: "none",
              stroke: theme.palette.gray[200],
              strokeWidth: "1.5px",
            },
          },
        }}
      />
    </RootUIContainer>
  );
};

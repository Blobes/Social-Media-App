"use client";

import React from "react";
import { useTheme } from "@mui/material/styles";
import { ScreenShareOff } from "lucide-react";
import { RootUIContainer } from "./Containers";
import { Feedback } from "./Feedback";

interface offlineProps {
  handleOffline: () => void;
}

export const OfflinePromptUI = ({ handleOffline }: offlineProps) => {
  const theme = useTheme();

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
        headline="You seem to be offline"
        tagline="  Switch to offline mode to view offline contents."
        icon={<ScreenShareOff />}
        primaryCta={{
          type: "BUTTON",
          variant: "outlined",
          label: "Switch mode",
          action: () => handleOffline(),
        }}
        style={{
          container: {
            height: "100%",
            backgroundColor: "none",
          },
          headline: { fontSize: "24px!important" },
          tagline: { fontSize: "15px" },
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

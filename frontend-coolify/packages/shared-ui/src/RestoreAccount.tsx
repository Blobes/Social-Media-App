"use client";

import React from "react";
import { ShieldBan } from "lucide-react";
import { Feedback } from "./Feedback";
import { useTheme } from "@mui/material/styles";

interface RestoreProps {
  headline?: string;
  tagline?: string;
}

export const RestoreAccount = ({ headline, tagline }: RestoreProps) => {
  const theme = useTheme();
  return (
    <Feedback
      headline={headline || "Account is Deactivated"}
      tagline={tagline || "To restore it, click the 'Restore account' button"}
      style={{
        container: {
          padding: theme.boxSpacing(18),
          backgroundColor: theme.palette.gray[0],
          border: `1px solid ${theme.fixedColors.mainTrans}`,
        },
        primaryCta: { width: "100%" },
        icon: {
          width: "40px",
          height: "40px",
        },
      }}
      icon={<ShieldBan />}
      primaryCta={{
        label: "Restore account",
        action: () => alert("Will take user to account restoration screen"),
      }}
    />
  );
};

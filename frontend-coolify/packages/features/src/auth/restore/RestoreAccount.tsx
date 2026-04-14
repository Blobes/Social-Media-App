"use client";

import React from "react";
import { ShieldBan } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { Feedback } from "@repo/shared-ui";
import { usePage } from "@repo/shared-state";
import { CLIENT_ROUTES } from "@repo/core";

interface RestoreProps {
  headline?: string;
  tagline?: string;
}

export const RestoreAccount = ({ headline, tagline }: RestoreProps) => {
  const theme = useTheme();
  const { navigateTo } = usePage();

  return (
    <Feedback
      headline={headline || "Account is Deactivated"}
      tagline={tagline || "To restore it, click the 'Restore account' button"}
      style={{
        container: {
          padding: theme.boxSpacing(18),
          backgroundColor: theme.palette.gray[0],
          border: `1px solid ${theme.fixedColors.pTrans}`,
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
        action: () => navigateTo(CLIENT_ROUTES.restoreAccount),
      }}
    />
  );
};

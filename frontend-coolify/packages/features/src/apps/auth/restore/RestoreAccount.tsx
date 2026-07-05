"use client";

import React from "react";
import { ShieldBan } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { Feedback } from "@repo/shared-ui";
import { usePage, useStaticTranslation } from "@repo/shared-hooks";
import {
  AUTH_BUTTON_LABELS,
  AUTH_FEEDBACK,
  CLIENT_ROUTES,
  TransData,
} from "@repo/core";

interface RestoreProps extends TransData {}

export const RestoreAccount = ({ headline, textDesc }: RestoreProps) => {
  const theme = useTheme();
  const { navigateTo } = usePage();
  const { translateTxtString } = useStaticTranslation();

  return (
    <Feedback
      transData={{
        headline: headline || AUTH_FEEDBACK.account_deactivated_headline,
        textDesc: textDesc || AUTH_FEEDBACK.account_deactivated_tagline,
      }}
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
        label: translateTxtString(AUTH_BUTTON_LABELS.restore_account),
        action: () => navigateTo(CLIENT_ROUTES.restoreAccount),
      }}
    />
  );
};

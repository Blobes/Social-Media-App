"use client";

import React from "react";
import { useTheme } from "@mui/material/styles";
import { Login } from "./Login";
import { Stack } from "@mui/material";
import { useGlobalContext } from "@repo/shared-state";
import { applyBGPattern } from "@repo/helpers";
import { Feedback } from "@repo/shared-ui";
import { ShieldCheck } from "lucide-react";
import { usePage, useMisc } from "@repo/shared-state";
import { ComfirmLogout } from "@repo/features";
import { CLIENT_ROUTES } from "@repo/core";

export default function LoginPage() {
  const theme = useTheme();
  const { authStatus } = useGlobalContext();
  const { openModal, closeModal } = useMisc();
  const { navigateTo } = usePage();

  return (
    <Stack
      sx={{
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        padding: theme.boxSpacing(6),
        minHeight: "fit-content",
        ...applyBGPattern(),
      }}>
      {authStatus === "UNAUTHENTICATED" ? (
        <Login
          style={{
            container: {
              width: "400px",
              padding: theme.boxSpacing(18, 16),
              mobile: {
                padding: theme.boxSpacing(16, 10),
              },
            },
          }}
        />
      ) : (
        <Feedback
          headline="You are already signed in"
          tagline="Return to funstakes.com or logout."
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
          icon={<ShieldCheck />}
          primaryCta={{
            label: "Go to Funstakes.com",
            action: () =>
              navigateTo(CLIENT_ROUTES.home, {
                type: "replace",
                loadPage: true,
              }),
            href: CLIENT_ROUTES.home.path,
          }}
          secondaryCta={{
            label: "Logout",
            action: () =>
              openModal({ content: <ComfirmLogout />, onClose: closeModal }),
          }}
        />
      )}
    </Stack>
  );
}

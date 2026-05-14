"use client";

import React from "react";
import { useTheme } from "@mui/material/styles";
import { Login } from "./Login";
import { Stack } from "@mui/material";
import { applyBGPattern } from "@repo/helpers";
import { useMisc, useGlobalStore } from "@repo/shared-hooks";
import { ComfirmLogout, RestrictedUI } from "@repo/features";

export default function LoginPage() {
  const theme = useTheme();
  const authStatus = useGlobalStore((state) => state.authStatus);
  const { openModal, closeModal } = useMisc();

  return (
    <Stack
      sx={{
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        padding: theme.boxSpacing(6),
        minHeight: "fit-content",
        [theme.breakpoints.down("sm")]: {
          padding: theme.boxSpacing(2),
        },
        ...applyBGPattern(),
      }}>
      {authStatus === "UNAUTHENTICATED" ? (
        <Login
          style={{
            container: {
              width: "400px",
              padding: theme.boxSpacing(18, 16),
              mobile: {
                padding: theme.boxSpacing(6, 6),
              },
            },
          }}
        />
      ) : (
        <RestrictedUI
          type="ALREADY_LOGGED_IN"
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

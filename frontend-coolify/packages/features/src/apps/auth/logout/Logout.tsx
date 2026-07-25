"use client";

import React from "react";
import { AppButton, TransText } from "@repo/shared-ui";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useMisc } from "@repo/shared-hooks";
import { LogOut, LogOutIcon } from "lucide-react";
import { useLogout } from "./useLogout";
import { AUTH_BUTTON_LABELS, AUTH_FEEDBACK, GenericStyle } from "@repo/core";
import { usePopup } from "@repo/features/src/hooks/usePopup";

export const ComfirmLogout = () => {
  const { closeModal } = useMisc();
  const { handleLogout } = useLogout();
  const theme = useTheme();

  return (
    <Stack
      sx={{
        alignItems: "center",
        textAlign: "center",
        justifyContent: "center",
      }}>
      <LogOutIcon />
      <TransText
        {...AUTH_FEEDBACK.logout_confirmation}
        component="h4"
        sx={theme.typography.h4}
      />
      <Stack direction="row">
        <AppButton variant="outlined" onClick={closeModal}>
          <TransText {...AUTH_BUTTON_LABELS.logout_not_really} noComponent />
        </AppButton>
        <AppButton variant="contained" onClick={async () => handleLogout()}>
          <TransText {...AUTH_BUTTON_LABELS.logout_sure_i_do} noComponent />
        </AppButton>
      </Stack>
    </Stack>
  );
};

interface LogoutProps {
  containerStyle?: GenericStyle;
  textStyle?: GenericStyle;
  iconStyle?: GenericStyle;
}

export const Logout = ({
  containerStyle,
  textStyle,
  iconStyle,
}: LogoutProps) => {
  const theme = useTheme();
  const { openPopup } = usePopup();

  return (
    <AppButton
      variant="text"
      onClick={() => openPopup("CONFIRM_LOGOUT")}
      style={{
        width: "100%",
        gap: theme.gap(10),
        padding: theme.boxSpacing(0),
        "& svg": {
          width: iconStyle?.size || 22,
          height: iconStyle?.size || 22,
          transform: "scale(-1)",
          ...iconStyle,
        },
        "&:hover": {
          background: "transparent",
          ...containerStyle?.hover,
        },
        ...containerStyle,
      }}>
      <LogOut />
      <TransText
        {...AUTH_BUTTON_LABELS.logout}
        sx={{
          ...theme.typography.text2,
          fontWeight: "600",
          color: theme.palette.gray[300],
          textAlign: "left",
          "&:hover": {
            color: theme.palette.primary.dark,
          },
          ...textStyle,
        }}
      />
    </AppButton>
  );
};

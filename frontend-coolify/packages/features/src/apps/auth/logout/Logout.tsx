"use client";

import React, { CSSProperties } from "react";
import { AppButton } from "@repo/shared-ui";
import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useMisc } from "@repo/shared-hooks";
import { LogIn, LogOut, LogOutIcon } from "lucide-react";
import { useLogout } from "./useLogout";
import { GenericStyle } from "@repo/core";

export const ComfirmLogout = () => {
  const { closeModal } = useMisc();
  const { handleLogout } = useLogout();

  return (
    <Stack
      sx={{
        alignItems: "center",
        textAlign: "center",
        justifyContent: "center",
      }}>
      <LogOutIcon />
      <Typography variant="h4" component="h4">
        Do you really want to logout?
      </Typography>
      <Stack direction="row">
        <AppButton variant="outlined" onClick={closeModal}>
          Not really
        </AppButton>
        <AppButton onClick={async () => handleLogout()}>Sure I do</AppButton>
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
  const { openModal, closeDrawer, closeModal } = useMisc();
  const theme = useTheme();

  return (
    <AppButton
      variant="text"
      onClick={() => {
        closeDrawer();
        openModal({ content: <ComfirmLogout />, onClose: closeModal });
      }}
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
      <Typography
        variant="body2"
        sx={{
          fontWeight: "600",
          color: theme.palette.gray[300],
          textAlign: "left",
          "&:hover": {
            color: theme.palette.primary.dark,
          },
          ...textStyle,
        }}>
        Logout
      </Typography>
    </AppButton>
  );
};

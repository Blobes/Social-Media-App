"use client";

import React from "react";
import { Stack, FormControl } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useGlobalContext } from "@repo/shared-hooks";
import { AppButton, UserAvatar, ResponsiveTextarea } from "@repo/shared-ui";
import { Image, Play } from "lucide-react";

export const VibeSlider = () => {
  const theme = useTheme();
  const { authUser } = useGlobalContext();
  if (!authUser) {
    return null;
  }
  const { firstName } = authUser;
  return (
    <Stack
      sx={{
        backgroundColor: theme.palette.gray.trans[1],
        borderRadius: theme.radius[2],
        flexDirection: "column",
        padding: theme.boxSpacing(6),
        gap: theme.gap(10),
        [theme.breakpoints.down("md")]: {
          margin: theme.boxSpacing(6),
        },
      }}>
      {/* Create field */}
      <Stack
        sx={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyItems: "flex-start",
          gap: theme.gap(2),
        }}>
        <UserAvatar
          userInfo={authUser}
          style={{
            width: "26px",
            height: "26px",
          }}
        />
        <FormControl fullWidth>
          <ResponsiveTextarea
            placeholder={`${firstName} express yourself today...`}
          />
        </FormControl>
      </Stack>
      {/* Actions */}
      <Stack
        sx={{
          paddingLeft: theme.boxSpacing(3),
          borderRadius: theme.radius[2],
          flexDirection: "row",
          alignItems: "center",
        }}>
        <AppButton
          variant="contained"
          style={{
            fontSize: "14px",
            backgroundColor: theme.palette.gray.trans[1],
            borderRadius: theme.radius.full,
            "&:hover": {
              backgroundColor: theme.palette.gray.trans[2],
            },
          }}>
          <Image size={20} /> Image
        </AppButton>
        <AppButton
          variant="contained"
          style={{
            fontSize: "14px",
            backgroundColor: theme.palette.gray.trans[1],
            borderRadius: theme.radius.full,
            "&:hover": {
              backgroundColor: theme.palette.gray.trans[2],
            },
          }}>
          <Play size={20} /> Video
        </AppButton>
      </Stack>
    </Stack>
  );
};

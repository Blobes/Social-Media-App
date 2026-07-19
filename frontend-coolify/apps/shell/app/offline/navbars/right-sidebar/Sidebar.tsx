"use client";

import React from "react";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { RecentMedia } from "./RecentMedia";
import { autoScroll } from "@repo/helpers";
import { TransText } from "@repo/shared-ui";
import { COMMON_MEDIA } from "@repo/core";

export const RightSidebar = () => {
  const theme = useTheme();

  return (
    <Stack
      sx={{
        width: "32%",
        minWidth: "300px",
        maxWidth: "500px",
        gap: theme.gap(8),
        flex: "none",
        padding: theme.boxSpacing(8, 20),
        ...autoScroll().base,
        [theme.breakpoints.down("md")]: {
          display: "none",
          ...autoScroll().mobile,
        },
      }}>
      <TransText
        component="h6"
        {...COMMON_MEDIA.recently_viewed_media}
        sx={{ ...theme.typography.text1, width: "100%" }}
      />
      <RecentMedia />
    </Stack>
  );
};

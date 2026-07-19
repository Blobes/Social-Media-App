"use client";

import React from "react";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ProfileCard } from "./ProfileCard";
import { Followers } from "./Followers";
import { autoScroll } from "@repo/helpers";
import { COMMON_FEEDBACK } from "@repo/core";
import { TransText } from "@repo/shared-ui";

export const RightSidebar = () => {
  const theme = useTheme();

  return (
    <Stack
      sx={{
        width: "34%",
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
      <ProfileCard />
      <TransText
        {...COMMON_FEEDBACK.those_following_you}
        sx={{ ...theme.typography.text1, width: "100%" }}
      />
      <Followers />
    </Stack>
  );
};

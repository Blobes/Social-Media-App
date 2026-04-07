"use client";

import React from "react";
import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ProfileCard } from "../components/ProfileCard";
import { Followers } from "./Followers";
import { autoScroll } from "@repo/helpers";

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
      <Typography variant="subtitle1" sx={{ width: "100%" }}>
        Those following you
      </Typography>
      <Followers />
    </Stack>
  );
};

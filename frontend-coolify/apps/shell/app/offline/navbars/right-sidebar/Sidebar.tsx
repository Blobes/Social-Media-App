"use client";

import React from "react";
import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { RecentMedia } from "./RecentMedia";
import { autoScroll } from "@repo/helpers";

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
      <Typography variant="subtitle1" sx={{ width: "100%" }}>
        Recently Viewed Images & Videos
      </Typography>
      <RecentMedia />
    </Stack>
  );
};

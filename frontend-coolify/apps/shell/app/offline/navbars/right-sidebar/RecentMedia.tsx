"use client";

import React from "react";
import { Stack, Typography, Divider } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useGlobalContext } from "@repo/shared-state";

export const RecentMedia = () => {
  const theme = useTheme();
  const { authUser } = useGlobalContext();

  return (
    <Stack
      sx={{
        backgroundColor: theme.fixedColors.pTrans,
        alignItems: "center",
        justifyContent: "flex-start",
        borderRadius: theme.radius[2],
        overflow: "hidden",
        height: "fit-content",
        flexShrink: 0,
        flexGrow: 0,
      }}>
      Get all the recently viewed media
    </Stack>
  );
};

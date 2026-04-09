"use client";

import React from "react";
import { IconButton, Stack, Typography, Fade } from "@mui/material";
import { capitalize } from "@repo/helpers";
import { PostType } from "@repo/core";
import { ChevronLeft, MoreVertical } from "lucide-react";

interface HeaderProps {
  postType?: PostType;
  onBackClick: () => void;
  onMoreClick: () => void;
  hide?: boolean;
}

export const IsolatedHeader = ({
  postType,
  onBackClick,
  onMoreClick,
  hide = false,
}: HeaderProps) => (
  <Fade in={!hide}>
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ p: 1 }}>
      <IconButton onClick={onBackClick}>
        <ChevronLeft />
      </IconButton>
      {postType && (
        <Typography variant="subtitle1" fontWeight="bold">
          {capitalize(postType.toLowerCase())}
        </Typography>
      )}
      <IconButton onClick={onMoreClick}>
        <MoreVertical />
      </IconButton>
    </Stack>
  </Fade>
);

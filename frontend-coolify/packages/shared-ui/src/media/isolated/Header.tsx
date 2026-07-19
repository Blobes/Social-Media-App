"use client";

import React from "react";
import { IconButton, Stack, Fade } from "@mui/material";
import { capitalize } from "@repo/helpers";
import { MediaSourceType } from "@repo/core";
import { ChevronLeft, MoreVertical } from "lucide-react";
import { TransText } from "../../Text";
import { useTheme } from "@mui/material/styles";

interface HeaderProps {
  sourceType?: MediaSourceType;
  onBackClick: () => void;
  onMoreClick: () => void;
  hide?: boolean;
}

/**
 * Overlay header bar exposing contextual media categories and action triggers.
 */
export const IsolatedHeader = ({
  sourceType,
  onBackClick,
  onMoreClick,
  hide = false,
}: HeaderProps) => {
  const theme = useTheme();

  return (
    <Fade in={!hide}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ p: 1 }}>
        <IconButton onClick={onBackClick}>
          <ChevronLeft />
        </IconButton>
        {sourceType && (
          <TransText sx={{ ...theme.typography.text1, fontWeight: 600 }}>
            {capitalize(sourceType.toLowerCase())}
          </TransText>
        )}
        <IconButton onClick={onMoreClick}>
          <MoreVertical />
        </IconButton>
      </Stack>
    </Fade>
  );
};

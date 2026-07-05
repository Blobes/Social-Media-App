"use client";

import React from "react";
import { Stack, IconButton, SxProps, Theme } from "@mui/material";
import { EllipsisVertical } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { SmartDate } from "@repo/shared-ui";
import { useAdaptiveTime } from "@repo/shared-hooks";

interface UseActions {
  useAdaptiveTime: () => any;
}

export interface ActionsProps {
  createdAt: string | number;
  onMore?: () => void;
  sx?: SxProps<Theme>;
  useActions: UseActions;
}

export const HeaderActions = ({
  createdAt,
  onMore,
  useActions,
  sx,
}: ActionsProps) => {
  const theme = useTheme();
  // const { useAdaptiveTime } = useActions;

  const iconButtonSx: SxProps<Theme> = {
    padding: theme.boxSpacing(2.5),
    borderRadius: theme.radius.full,
    [theme.breakpoints.down("md")]: {
      padding: theme.boxSpacing(0),
    },
  };

  return (
    <Stack
      direction="row"
      sx={{
        marginRight: theme.boxSpacing(-4),
        alignItems: "center",
        gap: 0,
        [theme.breakpoints.down("md")]: {
          gap: theme.gap(4),
          margin: 0,
        },
        ...sx,
      }}>
      <SmartDate
        timestamp={createdAt}
        adaptiveTime={useAdaptiveTime}
        sx={{
          ...theme.typography.body3,
          color: theme.palette.gray[200],
          padding: theme.boxSpacing(0, 4),
          width: "fit-content",
          flex: "none",
          [theme.breakpoints.down("md")]: {
            padding: theme.boxSpacing(0, 2),
          },
        }}
      />

      <IconButton sx={iconButtonSx} onClick={onMore}>
        <EllipsisVertical
          style={{ stroke: theme.palette.gray[200] }}
          size={20}
        />
      </IconButton>
    </Stack>
  );
};

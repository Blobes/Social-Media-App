"use client";

import React from "react";
import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { GenericStyle, IPost, IStake, QUERY_KEYS } from "@repo/core";
import { usePostSeen } from "../post/hooks/usePostSeen";

interface StakeProps {
  stake: IStake;
  style?: GenericStyle;
}

export const StakeCard = ({ stake, style = {} }: StakeProps) => {
  const theme = useTheme();
  const { content, media } = stake;
  const { elementRef } = usePostSeen<IPost>(stake as IPost, [
    QUERY_KEYS.POST.STAKES,
  ]);

  return (
    <Stack
      ref={elementRef as React.RefObject<HTMLDivElement>}
      sx={{
        gap: theme.gap(0),
        flexGrow: "0",
        flexShrink: "0",
        minHeight: "200px",
        background: `center / cover no-repeat url(${media[0].url}),
                ${theme.palette.gray.trans.overlay()}`,
        borderRadius: theme.radius[3],
        ...style,
      }}>
      {/* Post content */}
      <Typography
        variant="body2"
        sx={{
          padding: theme.boxSpacing(6, 0),
          textAlign: "center",
          [theme.breakpoints.down("md")]: {
            padding: theme.boxSpacing(6),
          },
        }}>
        {content}{" "}
      </Typography>
    </Stack>
  );
};

"use client";

import React from "react";
import { Stack, SxProps, Theme } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AuthorInfo, AuthorProps } from "./Author";
import { HeaderActions, ActionsProps } from "./Actions";

export interface PostHeaderProps {
  authorProps: AuthorProps;
  actionProps: ActionsProps;
  sx?: SxProps<Theme>;
}

export const PostHeader = ({
  authorProps,
  actionProps,
  sx,
}: PostHeaderProps) => {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      sx={{
        alignItems: "flex-start",
        //    width: "100%",
        gap: theme.gap(1),
        [theme.breakpoints.down("md")]: {
          padding: theme.boxSpacing(0, 4),
        },
        ...sx,
      }}>
      <AuthorInfo {...authorProps} />

      <HeaderActions
        {...actionProps}
        sx={{
          marginRight: theme.boxSpacing(-4),
          [theme.breakpoints.down("md")]: { margin: 0 },
        }}
      />
    </Stack>
  );
};

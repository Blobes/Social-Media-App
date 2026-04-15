"use client";

import React from "react";
import { Stack, Typography, SxProps, Theme } from "@mui/material";
import { IPostAuthor } from "@repo/core";
import { useTheme } from "@mui/material/styles";
import { UserAvatar } from "@repo/shared-ui";

export interface AuthorProps {
  author: IPostAuthor;
  avatarSize?: string;
  showUsername?: boolean;
  sx?: SxProps<Theme>;
}

export const AuthorInfo = ({
  author,
  avatarSize = "32px",
  showUsername = true,
  sx,
}: AuthorProps) => {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      sx={{ alignItems: "center", gap: theme.gap(2), ...sx }}>
      <UserAvatar
        userInfo={{
          firstName: author.firstName,
          lastName: author.lastName,
          profileImage: author.profileImage,
        }}
        style={{ width: avatarSize, height: avatarSize }}
        aria-label={author.fullName}
      />
      <Stack sx={{ width: "100%", gap: theme.gap(0), minWidth: "40px" }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: "bold" }}>
          {author.fullName}
        </Typography>
        {showUsername && (
          <Typography
            variant="body3"
            noWrap
            sx={{ color: theme.palette.gray[200], lineHeight: "1.1em" }}>
            @{author.username}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
};

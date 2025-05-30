"use client";

import React from "react";
import { Avatar, IconButton, Typography } from "@mui/material";
import { deepOrange } from "@mui/material/colors";
import { extractInitials } from "src/shared/helpers/helpers";
import { BasicTooltip } from "src/shared/components/Tooltips";
import { User } from "@/shared/types";
import { GenericObject } from "@/shared/types";
import { useTheme } from "@mui/material/styles";

interface UserAvatarProps {
  user: User | null;
  action?: () => void;
  url?: string;
  style?: GenericObject<string>;
  toolTipValue?: string;
}

export const UserAvatar = ({
  user,
  action,
  url,
  style = { bgcolor: deepOrange[500], width: "30px", height: "30px" },
  toolTipValue = "",
}: UserAvatarProps) => {
  const theme = useTheme();
  if (!user) {
    return null;
  }
  const { firstName, lastName, profileImage } = user;
  const initials = extractInitials(`${firstName} ${lastName}`);
  const { marginTop, ...others } = style;

  return (
    <BasicTooltip title={toolTipValue} sx={{ borderRadius: theme.radius[3] }}>
      <IconButton
        {...(url ? { href: url } : {})}
        onClick={action && action}
        sx={{
          borderRadius: theme.radius[100],
          padding: theme.boxSpacing(2),
          ...(marginTop !== undefined ? { marginTop } : {}),
        }}
        aria-label="User profile">
        <Avatar
          sx={{
            ...others,
            borderRadius: theme.radius[100],
          }}
          alt={`${firstName} ${lastName}`}
          children={initials}
          src={profileImage ? profileImage : " "}
        />
      </IconButton>
    </BasicTooltip>
  );
};

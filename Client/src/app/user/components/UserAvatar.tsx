"use client";

import React from "react";
import { Avatar, IconButton, Typography } from "@mui/material";
import { deepOrange } from "@mui/material/colors";
import { extractInitials } from "src/shared/helpers/helpers";
import { BasicTooltip } from "src/shared/components/Tooltips";
import { User } from "../../../data/models";
import { GenericObject } from "@/shared/types";
import { useTheme } from "@mui/material/styles";

interface UserAvatarProps {
  user: User | null;
  action?: () => void;
  url?: string;
  style?: GenericObject<string>;
  tootTipValue?: string;
}

export const UserAvatar = ({
  user,
  action,
  url,
  style = { bgcolor: deepOrange[500], width: "30px", height: "30px" },
  tootTipValue = "",
}: UserAvatarProps) => {
  const theme = useTheme();
  if (!user) {
    return null;
  }
  const { firstName, lastName, profileImage } = user;
  const initials = extractInitials(`${firstName} ${lastName}`);
  const { marginTop, ...others } = style;

  return (
    <BasicTooltip
      title={tootTipValue}
      sx={{ marginTop: marginTop, borderRadius: theme.radius[3] }}>
      <IconButton
        {...(url ? { href: url } : {})}
        onClick={action && action}
        aria-label="User profile">
        <Avatar
          sx={{
            ...others,
            borderRadius: theme.radius[3],
          }}
          alt={`${firstName} ${lastName}`}
          children={initials}
          src={profileImage ? profileImage : " "}
        />
      </IconButton>
    </BasicTooltip>
  );
};

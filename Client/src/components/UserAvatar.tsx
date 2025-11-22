"use client";

import React from "react";
import { Avatar, IconButton } from "@mui/material";
import { getInitialsWithColors } from "@/helpers/others";
import { BasicTooltip } from "@/components/Tooltips";
import { GenericObject } from "@/types";
import { useTheme } from "@mui/material/styles";

interface UserAvatarProps {
  userInfo: { firstName?: string; lastName?: string; profileImage?: string };
  action?: (e: React.MouseEvent<HTMLElement>) => void;
  url?: string;
  style?: GenericObject<string>;
  toolTipValue?: string;
}

export const UserAvatar = ({
  userInfo,
  action,
  url,
  style = { width: "30px", height: "30px" },
  toolTipValue = "",
}: UserAvatarProps) => {
  const theme = useTheme();
  const { firstName, lastName, profileImage } = userInfo;

  if (!firstName && !lastName && !profileImage) {
    return null;
  }

  const initials = getInitialsWithColors(`${firstName} ${lastName}`);
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
            color: initials.textColor,
            bgcolor: initials.bgColor,
            borderRadius: theme.radius[100],
            fontSize: "14px",
            fontWeight: "500",
            ...others,
          }}
          alt={`${firstName} ${lastName}`}
          children={initials.initials}
          src={profileImage ? profileImage : " "}
        />
      </IconButton>
    </BasicTooltip>
  );
};

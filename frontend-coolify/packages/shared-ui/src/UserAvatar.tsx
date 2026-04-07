"use client";

import React from "react";
import { Avatar, IconButton } from "@mui/material";
import { getInitialsAndColors } from "@repo/helpers";
import { BasicTooltip } from "./Tooltips";
import { GenericObject, IUser } from "@repo/types";
import { useTheme } from "@mui/material/styles";

interface UserAvatarProps {
  userInfo: IUser | null;
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

  if (!userInfo) {
    return null;
  }
  const { firstName, lastName, profileImage } = userInfo;

  const initials = getInitialsAndColors(`${firstName} ${lastName}`);
  const { marginTop, marginLeft, ...others } = style;

  return (
    <BasicTooltip title={toolTipValue} sx={{ borderRadius: theme.radius[3] }}>
      <IconButton
        {...(url ? { href: url } : {})}
        onClick={action && action}
        sx={{
          borderRadius: theme.radius.full,
          padding: theme.boxSpacing(2),
          ...(marginLeft && { marginLeft }),
          ...(marginTop && { marginTop }),
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

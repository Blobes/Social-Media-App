"use client";

import React from "react";
import { Avatar, IconButton } from "@mui/material";
import { getInitialsAndColors } from "@funstakes/helpers";
import { BasicTooltip } from "./Tooltips";
import { GenericObject } from "libs/type/type";
import { useTheme } from "@mui/material/styles";
import { useGlobalContext } from "@funstakes/shared-state";

interface UserAvatarProps {
  userInfo?: { firstName?: string; lastName?: string; profileImage?: string };
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
  const { authUser } = useGlobalContext();
  const info = userInfo ?? authUser;

  if (!info) {
    return null;
  }
  const { firstName, lastName, profileImage } = info;

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

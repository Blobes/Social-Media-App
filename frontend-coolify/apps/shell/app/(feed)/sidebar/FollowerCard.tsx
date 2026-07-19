"use client";

import React from "react";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useUser } from "@repo/features";
import { TransText, UserAvatar } from "@repo/shared-ui";
import { COMMON_BUTTON_LABELS, COMMON_FEEDBACK, IUser } from "@repo/core";
import { AnchorLink, AppButton, Strip } from "@repo/shared-ui";
import { useStaticTranslation } from "@repo/shared-hooks";

interface FollowerProps {
  follower: IUser;
}
export const FollowerCard = ({ follower }: FollowerProps) => {
  const theme = useTheme();
  const { handleFollow, followedUser, isLoading } = useUser(follower._id);
  const { translateTxtString } = useStaticTranslation();

  if (!followedUser) return null;

  const { username, fullName, isFollowing, followsMe } = followedUser;

  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{ width: "100%", gap: theme.gap(6) }}>
      <AnchorLink
        href="#"
        style={{
          width: "100%",
          flexGrow: 1,
          display: "flex",
          flexDirection: "row",
          gap: theme.gap(4),
          textDecoration: "none",
          alignItems: "center",
        }}>
        <UserAvatar
          userInfo={followedUser}
          style={{
            width: "35px",
            height: "35px",
          }}
        />
        <Stack sx={{ width: "100%", gap: theme.gap(0) }}>
          <TransText
            noWrap={true}
            sx={{
              ...theme.typography.text3,
              fontWeight: 600,
              textAlign: "left",
            }}>
            {fullName}
          </TransText>
          <TransText
            sx={{
              ...theme.typography.text4,
              margin: "unset!important",
              textAlign: "left",
            }}
            noWrap={true}>
            <Strip
              items={[
                { text: username },
                ...(isFollowing && followsMe
                  ? [{ text: translateTxtString(COMMON_FEEDBACK.following) }]
                  : []),
              ]}
            />
          </TransText>
        </Stack>
      </AnchorLink>

      <AppButton
        variant="outlined"
        options={{ disabled: isLoading }}
        style={{
          ...theme.typography.text6,
          padding: theme.boxSpacing(1, 5),
          borderColor: theme.palette.gray.trans[2],
        }}
        onClick={() => handleFollow(follower)}>
        <TransText
          {...COMMON_BUTTON_LABELS.follow_toggle(
            isFollowing ? "Unfollow" : "Follow back",
          )}
          noComponent
        />
      </AppButton>
    </Stack>
  );
};

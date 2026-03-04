"use client";

import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useUser } from "@repo/profile/shared";
import { UserAvatar } from "@repo/shared-ui";
import { IUser } from "@repo/types";
import { AnchorLink, AppButton, Strip } from "@repo/shared-ui";

interface FollowerProps {
  follower: IUser;
}
export const FollowerCard = ({ follower }: FollowerProps) => {
  const theme = useTheme();
  const { handleFollow, updatedUser, isLoading } = useUser();

  if (!updatedUser) return null;

  const { username, firstName, lastName, fullName,
    profileImage, isFollowing, followsMe } = updatedUser;

  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{ width: "100%", gap: theme.gap(6) }}>
      <AnchorLink
        url="#"
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
          userInfo={{ firstName, lastName, profileImage }}
          style={{
            width: "35px",
            height: "35px",
          }}
        />
        <Stack sx={{ width: "100%", gap: theme.gap(0) }}>
          <Typography
            variant="body2"
            fontWeight={600}
            noWrap={true}
            sx={{ textAlign: "left" }}>
            {fullName}
          </Typography>
          <Typography
            variant="body3"
            sx={{ margin: "unset!important", textAlign: "left" }}
            noWrap={true}>
            <Strip
              items={[
                { text: username },
                ...(isFollowing && followsMe ? [{ text: "Following" }] : []),
              ]}
            />
          </Typography>
        </Stack>
      </AnchorLink>

      <AppButton
        variant="outlined"
        options={{ disabled: isLoading }}
        style={{
          fontSize: "13px",
          padding: theme.boxSpacing(1, 5),
          borderColor: theme.palette.gray.trans[2],
        }}
        onClick={() => handleFollow(follower)}>
        {isFollowing ? "Unfollow" : "Follow back"}
      </AppButton>
    </Stack>
  );
};

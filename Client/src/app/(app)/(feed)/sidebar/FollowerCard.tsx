"use client";

import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useGlobalContext } from "@/app/GlobalContext";
import { UserAvatar } from "@/components/UserAvatar";
import { useUser } from "@/app/(app)/profile/userHooks";
import { IUser } from "@/types";
import { useEffect, useState } from "react";
import { AnchorLink, AppButton } from "@/components/Buttons";
import { Strip } from "@/components/StripBar";


interface FollowerProps {
  followerId: string;
}
export const FollowerCard = ({ followerId }: FollowerProps) => {
  const theme = useTheme();
  const { authUser, setAuthUser } = useGlobalContext();
  const [follower, setFollower] = useState<IUser | null>(null);
  const { handleFollow, getUser } = useUser();

  useEffect(() => {
    if (!followerId) return;
    const fetchUser = async () => {
      try {
        const res = await getUser(followerId);
        if (res.payload) setFollower(res.payload);
      } catch (err) {
        setFollower(null);
      }
    };
    fetchUser();
  }, [followerId]);

  if (!authUser || !follower) return null;

  const { _id, username, firstName, lastName, profileImage, followers } =
    follower!;
  const isFollowing = followers?.includes(authUser._id);
  const followingEachOther =
    followers?.includes(authUser._id) && authUser.followers?.includes(_id);

  const handleFollower = async () => {
    const updated = await handleFollow(_id);
    if (updated && updated.payload) {
      const { currentUser, targetUser } = updated.payload;
      setFollower(targetUser);
      setAuthUser(currentUser);
    }
  };

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
            {`${firstName} ${lastName}`}
          </Typography>
          <Typography
            variant="body3"
            sx={{ margin: "unset!important", textAlign: "left" }}
            noWrap={true}>
            <Strip
              items={[
                { text: username },
                ...(followingEachOther ? [{ text: "Following" }] : []),
              ]}
            />
          </Typography>
        </Stack>
      </AnchorLink>

      <AppButton
        variant="outlined"
        style={{
          fontSize: "13px",
          padding: theme.boxSpacing(1, 5),
          borderColor: theme.palette.gray.trans[2],
        }}
        onClick={() => handleFollower()}>
        {isFollowing ? "Unfollow" : "Follow back"}
      </AppButton>
    </Stack>
  );
};

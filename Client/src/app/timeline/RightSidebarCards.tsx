"use client";

import { Stack, Typography, Divider } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAppContext } from "@/app/AppContext";
import Image from "next/image";
import { UserAvatar } from "@/components/UserAvatar";
import { useUser } from "@/app/user/userHooks";
import { GenericObject, IUser } from "@/types";
import { useEffect, useState } from "react";
import { Post } from "@/types";
import { AnchorLink, AppButton } from "@/components/Buttons";
import { summarizeNum } from "@/helpers/others";
import { Strip } from "@/components/StripBar";

export const ProfileCard = () => {
  const theme = useTheme();
  const { authUser } = useAppContext();

  if (!authUser) return null;
  const { firstName, lastName, coverImage, email, followers, following } =
    authUser;
  return (
    <Stack
      sx={{
        backgroundColor: theme.fixedColors.mainTrans,
        alignItems: "center",
        justifyContent: "flex-start",
        borderRadius: theme.radius[2],
        overflow: "hidden",
        height: "fit-content",
        flexShrink: 0,
        flexGrow: 0,
      }}>
      <Image
        src={coverImage || "/assets/images/cover.jpg"}
        width={400}
        height={130}
        alt="Image cover"
        style={{ objectFit: "cover", width: "100%" }}
      />
      <UserAvatar
        userInfo={authUser}
        toolTipValue="User profile"
        style={{
          border: `3px solid ${theme.palette.gray[0]}`,
          marginTop: theme.boxSpacing(-20),
          width: "70px",
          height: "70px",
          fontSize: "30px",
        }}
      />
      <Stack
        sx={{
          width: "100%",
          textAlign: "center",
          padding: theme.boxSpacing(0, 12, 12, 12),
          alignItems: "center",
          justifyContent: "center",
          gap: theme.gap(1),
        }}>
        <Typography
          variant="subtitle1"
          noWrap={true}>{`${firstName} ${lastName}`}</Typography>
        <Typography component="p" variant="body2" noWrap={true}>
          {email}
        </Typography>
        <Divider />
        <Stack flexDirection="row" width="inherit">
          <Stack
            spacing={`${theme.gap(-5)}`}
            sx={{
              width: "inherit",
              borderRight: `1px solid ${theme.palette.gray.trans[1]}`,
            }}>
            <Typography variant="subtitle1">
              {summarizeNum(followers?.length!)}
            </Typography>
            <Typography variant="body3">Followers</Typography>
          </Stack>
          <Stack sx={{ width: "inherit" }} spacing={`${theme.gap(-5)}`}>
            <Typography variant="subtitle1">
              {summarizeNum(following?.length!)}
            </Typography>
            <Typography variant="body3">Following</Typography>
          </Stack>
        </Stack>
        <Divider />
        <AppButton
          variant="outlined"
          style={{
            alignSelf: "center",
            width: "100%",
            fontSize: "14px",
            padding: theme.boxSpacing(2, 5),
            borderColor: theme.palette.gray.trans[2],
          }}>
          My profile
        </AppButton>
      </Stack>
    </Stack>
  );
};

interface FollowerProps {
  followerId: string;
}
export const FollowerCard = ({ followerId }: FollowerProps) => {
  const theme = useTheme();
  const { authUser, setAuthUser } = useAppContext();
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

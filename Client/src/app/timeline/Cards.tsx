"use client";

import {
  Stack,
  Card,
  Typography,
  Divider,
  Button,
  IconButton,
  CardHeader,
  CardMedia,
  CardContent,
  CardActions,
  Link,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAppContext } from "@/app/AppContext";
import Image from "next/image";
import { UserAvatar } from "@/app/user/components/UserAvatar";
import { userData as users } from "@/data/userData";
import { Favorite, Share, MoreHoriz, Bookmark } from "@mui/icons-material";
import { useUser } from "@/app/user/userHooks";
import { GenericObject } from "@/shared/types";
import { useState } from "react";
import { heartBeat } from "@/shared/helpers/animations";
import { usePost } from "./usePost";
import { Post } from "@/shared/types";
import { red } from "@mui/material/colors";
import { CustomButton } from "@/shared/components/Buttons";

export const ProfileCard = () => {
  const theme = useTheme();
  const { user } = useAppContext();
  if (!user) {
    return null;
  }
  const { firstName, lastName, coverImage, email, followers, following } = user;
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
        user={user}
        toolTipValue="User profile"
        style={{
          border: `3px solid ${theme.palette.gray[0]}`,
          marginTop: theme.boxSpacing(-20),
          width: "70px",
          height: "70px",
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
            <Typography variant="subtitle1">{followers?.length}</Typography>
            <Typography variant="body3">Followers</Typography>
          </Stack>
          <Stack sx={{ width: "inherit" }} spacing={`${theme.gap(-5)}`}>
            <Typography variant="subtitle1">{following?.length}</Typography>
            <Typography variant="body3">Following</Typography>
          </Stack>
        </Stack>
        <Divider />
        <CustomButton
          variant="outlined"
          label=" View profile"
          style={{ alignSelf: "center", width: "100%" }}
        />
      </Stack>
    </Stack>
  );
};

export const FollowersCard = () => {
  const theme = useTheme();
  const { user: me } = useAppContext();
  const { handleFollow } = useUser();

  if (!me || !users) {
    return null;
  }

  const myFollowers = users.filter((user) => {
    return me.followers?.includes(user._id);
  });

  return (
    <Stack gap={2}>
      {myFollowers.length === 0 ? (
        <Typography>No followers</Typography>
      ) : (
        myFollowers.map((follower) => {
          const {
            id,
            firstName,
            lastName,
            email,
            followers: theirFollowers,
          } = follower;
          const isFollowingBack = theirFollowers?.includes(me._id);

          return (
            <Stack key={id} direction="row" alignItems="center" spacing={1}>
              <UserAvatar
                user={follower}
                style={{
                  width: "35px",
                  height: "35px",
                }}
              />
              <Link
                href="#"
                noWrap
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: theme.spacing(0.5),
                  textDecoration: "none",
                }}>
                <Typography variant="body2" fontWeight={600}>
                  {`${firstName} ${lastName}`}
                </Typography>
                <Typography variant="body3">{email}</Typography>
              </Link>
              <CustomButton
                variant="outlined"
                label={isFollowingBack ? "Unfollow" : "Follow back"}
                onClick={() => handleFollow(id)}
              />
            </Stack>
          );
        })
      )}
    </Stack>
  );
};

interface PostProps {
  post: Post;
  style?: GenericObject<string>;
}
export const PostCard = ({ post, style = {} }: PostProps) => {
  const theme = useTheme();
  const { id, authorId, content, postImage, createdOn, likes } = post;
  const author = users.find((user) => user.id === authorId);
  const authorFullName = `${author!.firstName} ${author!.lastName}`;

  const { user: currentUser } = useAppContext();
  const alreadyLiked = post.likes.includes(currentUser!._id) ? true : false;

  const [isLiking, setLiking] = useState(false);
  const { handlePostLike } = usePost();
  const handleLike = () => {
    setLiking(!isLiking);
    setTimeout(() => setLiking(false), 200); // Animation only
    handlePostLike(id);
  };

  return (
    <Card
      key={id}
      sx={{
        backgroundColor: "unset",
        backgroundImage: "unset",
        borderRadius: "unset",
        padding: theme.boxSpacing(6, 0),
        display: "flex",
        flexDirection: "column",
        gap: theme.gap(4),
        ...style,
      }}>
      {/* Post meta details */}
      <CardHeader
        sx={{ padding: theme.boxSpacing(0, 8, 0, 4) }}
        avatar={
          <UserAvatar
            style={{ transform: "scale(1)" }}
            user={author!}
            aria-label={authorFullName}
          />
        }
        action={
          <IconButton aria-label="settings">
            <MoreHoriz sx={{ fill: theme.palette.gray[200] }} />
          </IconButton>
        }
        title={
          <Typography variant="body2">
            <b>{authorFullName}</b>
          </Typography>
        }
        subheader={
          <Typography
            variant="body3"
            component="p"
            sx={{ color: theme.palette.gray[200] }}>
            {createdOn.toString()}
          </Typography>
        }
      />
      {/* Post content */}
      <CardContent sx={{ padding: theme.boxSpacing(0, 8) }}>
        <Typography variant="body2">{content}</Typography>
      </CardContent>
      {/* Post media */}
      {postImage && (
        <CardMedia
          component="img"
          image={postImage}
          alt="Post image"
          sx={{
            backgroundColor: "rgba(2, 2, 2, 0.03)",
          }}
        />
      )}

      {/* Post actions */}
      <CardActions sx={{ padding: theme.boxSpacing(0, 4) }} disableSpacing>
        <Stack direction={"row"} gap={theme.gap(2)} width={"100%"}>
          <IconButton
            sx={{
              padding: theme.boxSpacing(4),
              borderRadius: theme.radius[3],
            }}
            aria-label="add to favorites"
            onClick={handleLike}>
            <Favorite
              sx={{
                width: "22px",
                marginRight: theme.boxSpacing(2),
                ...(isLiking && {
                  animation: `${heartBeat} 0.3s linear`,
                }),
                fill: alreadyLiked ? red[500] : theme.palette.gray[200],
              }}
            />
            <Typography variant="body2">
              <b>{likes.length}</b>
            </Typography>
          </IconButton>

          <IconButton
            sx={{ padding: theme.boxSpacing(4), borderRadius: theme.radius[3] }}
            aria-label="add to bookmarks">
            <Bookmark
              sx={{
                width: "22px",
                marginRight: theme.boxSpacing(2),
                fill: theme.palette.gray[200],
              }}
            />
            <Typography variant="body2">
              <b>12.4k</b>
            </Typography>
          </IconButton>
        </Stack>

        <IconButton aria-label="share">
          <Share sx={{ fill: theme.palette.gray[200] }} />
        </IconButton>
      </CardActions>
    </Card>
  );
};

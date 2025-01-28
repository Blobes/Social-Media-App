"use client";

import {
  Box,
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
import { Favorite, Share, More } from "@mui/icons-material";
import { useUser } from "@/app/user/hooks/useUser";
import { GenericObject } from "../types";

export const ProfileCard = () => {
  const theme = useTheme();
  const { user } = useAppContext();
  if (!user) {
    return null;
  }
  const { firstName, lastName, coverImage, email, followers, following } = user;
  return (
    <Card
      sx={{
        display: "flex",
        backgroundColor: theme.fixedColors.mainTrans,
        flexDirection: "column",
        alignItems: "center",
      }}>
      <Image
        src={coverImage || ""}
        width={400}
        height={130}
        alt="Image cover"
        style={{ objectFit: "cover", width: "100%" }}
      />
      <UserAvatar
        user={user}
        tootTipValue="User profile"
        style={{
          border: `3px solid ${theme.palette.gray[0]}`,
          marginTop: theme.boxSpacing(-20),
          width: "60px",
          height: "60px",
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
            <Typography variant="subtitle1">{followers.length}</Typography>
            <Typography variant="body3">Followers</Typography>
          </Stack>
          <Stack sx={{ width: "inherit" }} spacing={`${theme.gap(-5)}`}>
            <Typography variant="subtitle1">{following.length}</Typography>
            <Typography variant="body3">Following</Typography>
          </Stack>
        </Stack>
        <Divider />
        <Button variant={"outlined"} sx={{ alignSelf: "center" }}>
          View profile
        </Button>
      </Stack>
    </Card>
  );
};

export const FollowersCard = () => {
  const theme = useTheme();
  const { user: me } = useAppContext();
  const { handleFollow } = useUser();
  if (!me || !users) {
    return null;
  }
  const myFollowers = users.filter((user, index) => {
    return me.followers.includes(user.id);
  });

  return (
    <Stack>
      {myFollowers.map((myFollower) => {
        const { id, firstName, lastName, email } = myFollower;
        return (
          <Stack key={id} direction={"row"} sx={{ alignItems: "center" }}>
            <UserAvatar
              user={myFollower}
              style={{
                width: "35px",
                height: "35px",
              }}
            />
            <Link
              href="#"
              noWrap={true}
              sx={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: theme.gap(0),
                textDecoration: "unset",
              }}>
              <Typography component="p" variant="body2" fontWeight={"600"}>
                {`${firstName} ${lastName}`}
              </Typography>
              <Typography component="p" variant="body3">
                {email}
              </Typography>
            </Link>
            <Button
              variant="outlined"
              onClick={() => handleFollow(id)}
              sx={{
                minWidth: "fit-content",
                height: "unset",
                alignSelf: "unset",
                fontSize: "14px",
                padding: theme.boxSpacing(2, 4),
              }}>
              {myFollower.followers.includes(me.id)
                ? "Unfollow"
                : "Follow back"}
            </Button>
          </Stack>
        );
      })}
    </Stack>
  );
};

interface PostProps {
  post: GenericObject<any>;
  style?: GenericObject<string>;
}
export const PostCard = ({ post, style = {} }: PostProps) => {
  const { author, postId, postContent, postImage, postDate } = post;
  const authorFullName = `${author!.firstName} ${author!.lastName}`;

  return (
    <Card key={postId} sx={{ ...style }}>
      {/* Post meta details */}
      <CardHeader
        avatar={
          <UserAvatar
            style={{ transform: "scale(1)" }}
            user={author}
            aria-label={authorFullName}
          />
        }
        action={
          <IconButton aria-label="settings">
            <More />
          </IconButton>
        }
        title={<Typography variant="body2">{authorFullName}</Typography>}
        subheader={postDate.toString()}
      />
      {/* Post content */}
      <CardContent>
        <Typography variant="body2">{postContent}</Typography>
      </CardContent>
      {/* Post media */}
      <CardMedia
        component="img"
        height="194"
        image={postImage || undefined}
        alt="Post image"
      />
      {/* Post actions */}
      <CardActions disableSpacing>
        <IconButton aria-label="add to favorites">
          <Favorite />
        </IconButton>
        <IconButton aria-label="share">
          <Share />
        </IconButton>
      </CardActions>
    </Card>
  );
};

"use client";

import {
  Stack,
  Card,
  Typography,
  Divider,
  IconButton,
  CardHeader,
  CardMedia,
  CardContent,
  CardActions,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAppContext } from "@/app/AppContext";
import Image from "next/image";
import { UserAvatar } from "@/components/UserAvatar";
import { Favorite, Share, MoreHoriz, Bookmark } from "@mui/icons-material";
import { useUser } from "@/app/user/userHooks";
import { GenericObject, IUser, SingleResponse } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { heartBeat } from "@/helpers/animations";
import { usePost } from "./postHooks";
import { Post } from "@/types";
import { red } from "@mui/material/colors";
import { AnchorLink, AppButton } from "@/components/Buttons";
import { fetcher } from "@/helpers/fetcher";
import { summarizeNum } from "@/helpers/others";
import { Strip } from "@/components/StripBar";
import { ModalRef } from "@/components/Modal";

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
interface PostProps {
  post: Post;
  style?: GenericObject<string>;
}

export const PostCard = ({ post, style = {} }: PostProps) => {
  const theme = useTheme();
  const { authUser, loginStatus } = useAppContext();
  const modalRef = useRef<ModalRef>(null);
  const { handlePostLike, getPendingLike, setPendingLike, clearPendingLike } =
    usePost();
  const [isLiking, setLiking] = useState(false);
  const [latestPost, setLatestPost] = useState<Post>(post);
  const [author, setAuthor] = useState<IUser | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { authorId, content, postImage, createdAt, likes } = latestPost;
  const userId = authUser?._id ?? "";
  const alreadyLiked = latestPost.likes.includes(authUser?._id ?? "");

  // Fetch Author
  const fetchAuthor = useCallback(async () => {
    if (!authorId) return;
    try {
      const res = await fetcher<SingleResponse<IUser>>(`/users/${authorId}`);
      setAuthor(res.payload);
      setMessage(res.message);
    } catch {
      setMessage("Failed to load author");
    }
  }, [authorId]);

  // Reconcile pending likes + author
  useEffect(() => {
    if (!authUser) return;
    fetchAuthor();

    const pending = getPendingLike(post._id);
    if (pending !== null) {
      setLatestPost((prev) => {
        const liked = prev.likes.includes(userId);
        return pending && !liked
          ? { ...prev, likes: [...prev.likes, userId] }
          : !pending && liked
          ? { ...prev, likes: prev.likes.filter((id) => id !== userId) }
          : prev;
      });
    }
  }, [authUser, post._id, getPendingLike, fetchAuthor, userId]);

  // Like Handler
  const handleLike = async () => {
    if (!authUser || loginStatus === "LOCKED") {
      modalRef.current?.openModal();
      return;
    }

    const userId = authUser._id;
    // Optimistically update
    setLatestPost((prev) => ({
      ...prev,
      likes: !alreadyLiked
        ? [...prev.likes, userId]
        : prev.likes.filter((id) => id !== userId),
    }));
    setPendingLike(post._id, !alreadyLiked);
    setLiking(true);

    // Sync like on server
    try {
      const res = await handlePostLike(post._id);
      if (res) {
        setLatestPost(res);
      }
    } catch (err) {
      console.error("Failed to sync like:", err);
      clearPendingLike(post._id);
    } finally {
      setTimeout(() => setLiking(false), 200);
    }
  };

  // ✅ Early return
  if (!authUser || !author) return null;

  const authorFullName = author ? `${author.firstName} ${author.lastName}` : "";

  return (
    <Card
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
      {/* Post Header */}
      <CardHeader
        sx={{ padding: theme.boxSpacing(0, 8, 0, 4) }}
        avatar={
          <UserAvatar
            userInfo={{
              firstName: author.firstName,
              lastName: author.lastName,
              profileImage: author.profileImage,
            }}
            style={{ width: "40px", height: "40px", fontSize: "20px" }}
            aria-label={authorFullName}
          />
        }
        action={
          <IconButton>
            <MoreHoriz sx={{ fill: theme.palette.gray[200] }} />
          </IconButton>
        }
        title={
          <Typography variant="body2">
            <b>{authorFullName}</b>
          </Typography>
        }
        subheader={
          <Typography variant="body3" sx={{ color: theme.palette.gray[200] }}>
            {createdAt.toString()}
          </Typography>
        }
      />

      {/* Content */}
      <CardContent sx={{ padding: theme.boxSpacing(0, 8) }}>
        <Typography variant="body2">{content}</Typography>
      </CardContent>

      {/* Media */}
      {postImage && postImage !== "" && (
        <CardMedia component="img" image={postImage} alt="Post image" />
      )}

      {/* Actions */}
      <CardActions sx={{ padding: theme.boxSpacing(0, 4) }} disableSpacing>
        <Stack direction="row" gap={theme.gap(2)} width="100%">
          <IconButton
            sx={{
              padding: theme.boxSpacing(4),
              borderRadius: theme.radius[3],
            }}
            onClick={handleLike}>
            <Favorite
              sx={{
                width: 22,
                mr: theme.boxSpacing(2),
                ...(isLiking && { animation: `${heartBeat} 0.3s linear` }),
                fill: alreadyLiked ? red[500] : theme.palette.gray[200],
              }}
            />
            <Typography variant="body2">
              <b>{summarizeNum(likes.length)}</b>
            </Typography>
          </IconButton>

          <IconButton
            sx={{
              padding: theme.boxSpacing(4),
              borderRadius: theme.radius[3],
            }}>
            <Bookmark
              sx={{
                width: 22,
                mr: theme.boxSpacing(2),
                fill: theme.palette.gray[200],
              }}
            />
            <Typography variant="body2">
              <b>12.4k</b>
            </Typography>
          </IconButton>
        </Stack>
        <IconButton>
          <Share sx={{ fill: theme.palette.gray[200] }} />
        </IconButton>
      </CardActions>
    </Card>
  );
};

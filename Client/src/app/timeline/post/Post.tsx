"use client";

import {
  Stack,
  Card,
  Typography,
  IconButton,
  CardHeader,
  CardMedia,
  CardContent,
  CardActions,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAppContext } from "@/app/AppContext";
import { UserAvatar } from "@/components/UserAvatar";
import { Favorite, Share, MoreHoriz, Bookmark } from "@mui/icons-material";
import { GenericObject, IUser, SingleResponse } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { heartBeat } from "@/helpers/animations";
import { usePost } from "./postHooks";
import { Post } from "@/types";
import { red } from "@mui/material/colors";
import { fetcher } from "@/helpers/fetcher";
import { summarizeNum } from "@/helpers/others";
import { AuthStepper } from "@/app/auth/login/AuthStepper";

interface PostProps {
  post: Post;
  style?: GenericObject<string>;
}
export const PostCard = ({ post, style = {} }: PostProps) => {
  const theme = useTheme();
  const { authUser, loginStatus, setModalContent } = useAppContext();
  const { handlePostLike, getPendingLike, setPendingLike, clearPendingLike } =
    usePost();
  const [isLiking, setLiking] = useState(false);
  const [latestPost, setLatestPost] = useState<Post>(post);
  const [author, setAuthor] = useState<IUser | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { authorId, content, postImage, createdAt, likes, status } = latestPost;
  const userId = authUser?._id ?? "";
  const alreadyLiked = latestPost.likes.includes(authUser?._id ?? "");

  // Fetch Author
  const fetchAuthor = useCallback(async () => {
    if (!authorId) return;
    try {
      const res = await fetcher<SingleResponse<IUser>>(`/users/${authorId}`);
      setAuthor(res.payload);
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
    if (!authUser || loginStatus !== "AUTHENTICATED") {
      setModalContent({ content: <AuthStepper /> });
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
  if (!authUser || !author)
    return (
      <Stack>
        <Typography>{message}</Typography>
      </Stack>
    );

  const authorFullName = author ? `${author.firstName} ${author.lastName}` : "";

  return status === "DELETED" ? (
    <Stack>
      <Typography>This post has been deleted by the author.</Typography>
    </Stack>
  ) : (
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

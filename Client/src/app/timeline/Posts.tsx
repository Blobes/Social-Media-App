"use client";

import { CircularProgress, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { PostCard } from "./Cards";
import { ScrollableContainer } from "@/components/Containers";
import { CreatePost } from "./CreatePost";
import { useEffect, useState } from "react";
import { Post } from "@/types";
import { usePost } from "./postHooks";
import { HourglassEmptyOutlined } from "@mui/icons-material";
import { useAppContext } from "../AppContext";
import { getCookie, setCookie } from "@/helpers/others";

export const Posts = () => {
  const theme = useTheme();
  const { getAllPost } = usePost();
  const [posts, setPosts] = useState<Post[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const { loginStatus, isGlobalLoading, setGlobalLoading } = useAppContext();

  const renderPosts = async () => {
    setGlobalLoading(true);
    try {
      const res = await getAllPost();
      const offlinePosts = getCookie("offlinePosts");

      if (loginStatus === "AUTHENTICATED" && res?.payload) {
        const firstFourPosts = res.payload.slice(0, 4);
        setPosts(res.payload);
        setMessage(res.message);
        setCookie("offlinePosts", JSON.stringify(firstFourPosts), 60 * 24);
      } else if (loginStatus !== "AUTHENTICATED" && offlinePosts) {
        const parsed = JSON.parse(offlinePosts) as Post[];
        setPosts(parsed);
      } else {
        setMessage("Login to view posts");
      }
    } finally {
      setGlobalLoading(false);
    }
  };
  useEffect(() => {
    renderPosts();
  }, [loginStatus]);

  return (
    <ScrollableContainer
      sx={{
        borderLeft: `1px solid ${theme.palette.gray.trans[1]}`,
        borderRight: `1px solid ${theme.palette.gray.trans[1]}`,
        width: "44%",
        maxWidth: "650px",
        minWidth: "400px",
      }}>
      <CreatePost />

      {isGlobalLoading && posts.length < 1 ? (
        <CircularProgress size={40} />
      ) : !isGlobalLoading && posts.length < 1 ? (
        <Stack>
          <HourglassEmptyOutlined
            sx={{ transform: "scale(1.5)", stroke: theme.palette.gray[200] }}
          />
          <Typography variant="h6" component={"h6"}>
            No post available!
          </Typography>
        </Stack>
      ) : isGlobalLoading === false && posts && posts.length > 0 ? (
        <Stack
          sx={{
            gap: "unset",
            height: "fit-content",
            padding: theme.boxSpacing(0),
          }}>
          {posts.map((post) => {
            return (
              <PostCard
                key={post._id}
                post={{
                  _id: post._id,
                  authorId: post.authorId,
                  content: post.content,
                  postImage: post.postImage,
                  likes: post.likes,
                  createdAt: post.createdAt,
                }}
                style={{
                  borderBottom: `1px solid ${theme.palette.gray.trans[1]}`,
                }}
              />
            );
          })}
        </Stack>
      ) : (
        <Stack>
          <HourglassEmptyOutlined
            sx={{ transform: "scale(1.5)", stroke: theme.palette.gray[200] }}
          />
          <Typography variant="h6" component={"h6"}>
            {message}
          </Typography>
        </Stack>
      )}
    </ScrollableContainer>
  );
};

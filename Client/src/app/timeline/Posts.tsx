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
import { delay, getCookie, setCookie } from "@/helpers/others";

export const Posts = () => {
  const theme = useTheme();
  const { getAllPost } = usePost();
  const [posts, setPosts] = useState<Post[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const { loginStatus } = useAppContext();
  const [isLoading, setLoading] = useState(false);
  console.log("Hel");

  const renderPosts = async () => {
    try {
      setLoading(true);
      await delay();

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
      setLoading(false);
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

      {isLoading ? (
        <CircularProgress size={40} />
      ) : posts.length < 1 ? (
        <Stack>
          <HourglassEmptyOutlined
            sx={{ transform: "scale(1.5)", stroke: theme.palette.gray[200] }}
          />
          <Typography variant="h6">No post available!</Typography>
        </Stack>
      ) : (
        <Stack
          sx={{
            gap: "unset",
            height: "fit-content",
            padding: theme.boxSpacing(0),
          }}>
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </Stack>
      )}
    </ScrollableContainer>
  );
};

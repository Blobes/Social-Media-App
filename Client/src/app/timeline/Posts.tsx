"use client";

import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { PostCard } from "./Cards";
import { postData as posts } from "@/data/postData";
import { userData as users } from "@/data/userData";
import { ScrollableContainer } from "@/shared/components/Containers";
import { CreatePost } from "./CreatePost";

export const Posts = () => {
  const theme = useTheme();
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

      {posts.length < 1 || users.length < 1 ? (
        <Typography variant="h6" component={"h6"}>
          No post available!
        </Typography>
      ) : (
        <Stack
          sx={{
            gap: "unset",
            height: "fit-content",
            padding: theme.boxSpacing(0),
          }}>
          {posts.map((post) => {
            return (
              <PostCard
                key={post.id}
                post={{
                  id: post.id,
                  authorId: post.authorId,
                  content: post.content,
                  postImage: post.postImage,
                  likes: post.likes,
                  createdOn: post.createdOn,
                }}
                style={{
                  borderBottom: `1px solid ${theme.palette.gray.trans[1]}`,
                }}
              />
            );
          })}
        </Stack>
      )}
    </ScrollableContainer>
  );
};

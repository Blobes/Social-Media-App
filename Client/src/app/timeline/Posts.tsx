"use client";

import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { PostCard } from "@/shared/components/Cards";
import { postData as posts } from "@/data/postData";
import { userData as users } from "@/data/userData";

export const Posts = () => {
  const theme = useTheme();
  return posts.length < 1 || users.length < 1 ? (
    <Stack>
      <Typography variant="h6" component={"h6"}>
        No post available!
      </Typography>
    </Stack>
  ) : (
    <Stack
      sx={{
        gap: "unset",
        height: "fit-content",
        padding: theme.boxSpacing(0),
      }}>
      {posts.map((post) => {
        const authorId = post.authorId;
        const author = users.find((user) => user.id === authorId);

        return !author ? (
          <Stack>
            <Typography variant="body2">post unavailable!</Typography>
          </Stack>
        ) : (
          <PostCard
            key={post.id}
            post={{
              postId: post.id,
              postContent: post.content,
              postImage: post.image,
              author: author,
              postDate: post.createdOn,
            }}
            style={{
              backgroundColor: "unset",
              backgroundImage: "unset",
              borderRadius: "unset",
              borderBottom: `1px solid ${theme.palette.gray.trans[2]}`,
            }}
          />
        );
      })}
    </Stack>
  );
};

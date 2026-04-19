"use client";

import React from "react";
import { useTheme } from "@mui/material/styles";
import { Stack } from "@mui/material";
import { FollowerCard } from "./FollowerCard";
import { ProgressIcon, Feedback } from "@repo/shared-ui";
import { UserMinus } from "lucide-react";
import { useUser } from "@repo/features";
import { useGlobalStore } from "@repo/shared-hooks";

export const Followers = () => {
  const theme = useTheme();
  const authUser = useGlobalStore((state) => state.authUser);
  const { followers, isLoading, message } = useUser(authUser?._id);

  return (
    <>
      {isLoading ? (
        <Stack
          sx={{
            padding: theme.boxSpacing(12, 4),
            alignItems: "center",
          }}>
          <ProgressIcon otherProps={{ size: 30 }} />
        </Stack>
      ) : authUser && followers && followers.length < 1 ? (
        <Feedback tagline="You don't have followers!" icon={<UserMinus />} />
      ) : followers && followers.length > 0 ? (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            gap: "unset",
            height: "fit-content",
            padding: theme.boxSpacing(0),
          }}>
          {followers.map((follower) => {
            return <FollowerCard key={follower._id} follower={follower} />;
          })}
        </Stack>
      ) : (
        <Feedback
          tagline={message || "Something went wrong."}
          icon={<UserMinus />}
        />
      )}
    </>
  );
};

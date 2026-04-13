"use client";

import React from "react";
import { useTheme } from "@mui/material/styles";
import { Stack } from "@mui/material";
import { useGlobalContext } from "@repo/shared-state";
import { useEffect } from "react";
import { FollowerCard } from "./FollowerCard";
import { ProgressIcon, Feedback } from "@repo/shared-ui";
import { UserMinus } from "lucide-react";
import { useUser } from "@repo/features";

export const Followers = () => {
  const theme = useTheme();
  const { authUser } = useGlobalContext();
  const { getFollowers, followers, isLoading, message } = useUser();

  useEffect(() => {
    if (authUser?._id) getFollowers(authUser._id);
  }, [authUser?._id, getFollowers]);

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

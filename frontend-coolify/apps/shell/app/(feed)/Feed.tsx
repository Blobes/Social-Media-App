"use client";

import React, { useMemo } from "react";
import { Stack, Typography } from "@mui/material";
import { VibeSlider } from "./vibezSlider/Slider";
import { Feedback, GistSkeleton, StakeSkeleton } from "@repo/shared-ui";
import { Milestone } from "lucide-react";
import { useFeed } from "./useFeed";
import { useTheme } from "@mui/material/styles";
import { GistCard, StakeCard } from "@repo/features";
import { autoScroll } from "@repo/helpers";
import { useCachedData } from "@repo/shared-hooks";
import { IPost, QUERY_KEYS } from "@repo/core";

export const Feed = () => {
  const theme = useTheme();
  const { feed: onlinePosts, message, isLoading, handleRefresh } = useFeed();

  const cachedPosts = useCachedData<IPost>([
    [QUERY_KEYS.POST.GISTS],
    [QUERY_KEYS.POST.STAKES],
  ]);

  // Determine which data to display. Priority: Online data > Cached data.
  const feed = onlinePosts.length > 0 ? onlinePosts : cachedPosts;

  const containerStyle = useMemo(
    () => ({
      width: "100%",
      height: "100%",
      minWidth: "400px",
      gap: theme.gap(8),
      padding: theme.boxSpacing(8, 24),
      ...(feed.length > 1 && autoScroll().base),
      [theme.breakpoints.down("md")]: {
        maxWidth: "unset",
        minWidth: "unset",
        padding: theme.boxSpacing(0),
        ...(!isLoading && autoScroll().mobile),
      },
    }),
    [theme, feed.length, isLoading, autoScroll],
  );

  return (
    <Stack sx={containerStyle}>
      <VibeSlider />

      {isLoading ? (
        <>
          <GistSkeleton />
          <StakeSkeleton />
        </>
      ) : feed.length < 1 ? (
        <Feedback
          tagline={message || "Something went wrong, check your network"}
          icon={<Milestone />}
          primaryCta={{
            type: "BUTTON",
            variant: "outlined",
            label: "Refresh",
            action: handleRefresh,
          }}
          style={{
            container: {
              height: "100%",
              backgroundColor: "none",
              gap: theme.gap(6),
            },
            tagline: { fontSize: "16px" },
            icon: {
              width: "50px",
              height: "50px",
              [theme.breakpoints.down("md")]: {
                width: "40px",
                height: "40px",
              },
              svg: {
                fill: "none",
                stroke: theme.palette.gray[200],
                strokeWidth: "1.5px",
              },
            },
          }}
        />
      ) : (
        feed.map((post) => {
          switch (post.postType) {
            case "GIST":
              return <GistCard key={post._id} gist={post} mode="ONLINE" />;

            case "STAKE":
              return <StakeCard key={post._id} stake={post} />;

            default:
              <Typography>Post type not found</Typography>;
          }
        })
      )}
    </Stack>
  );
};

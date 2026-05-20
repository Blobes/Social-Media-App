"use client";

import React, { useMemo } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { VibeSlider } from "./vibezSlider/Slider";
import {
  Feedback,
  GistSkeleton,
  ProgressIcon,
  StakeSkeleton,
} from "@repo/shared-ui";
import { Milestone } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { GistCard, StakeCard, useFeed } from "@repo/features";
import { autoScroll } from "@repo/helpers";
import {
  useCachedData,
  useInfiniteScroll,
  usePageCache,
} from "@repo/shared-hooks";
import { IPost, CACHE_KEYS } from "@repo/core";

export const Feed = () => {
  const theme = useTheme();
  const {
    feed: onlinePosts,
    message,
    isLoading,
    handleRefresh,
    rawData,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useFeed();

  const cachedPosts = useCachedData<IPost>([
    [CACHE_KEYS.POST.GISTS],
    [CACHE_KEYS.POST.STAKES],
  ]);

  usePageCache(rawData, CACHE_KEYS.POST.FEED);

  const { sentinelRef } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

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
            action: () => {
              handleRefresh();
            },
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
        <>
          {feed.map((post) => {
            switch (post.postType) {
              case "GIST":
                return <GistCard key={post._id} gist={post} mode="ONLINE" />;

              case "STAKE":
                return <StakeCard key={post._id} stake={post} />;

              default:
                <Typography>Post type not found</Typography>;
            }
          })}
          {/* Pagination Sentinel */}
          {hasNextPage && (
            <Box
              ref={sentinelRef}
              sx={{
                padding: theme.gap(4),
                display: "flex",
                justifyContent: "center",
                minHeight: "40px",
              }}>
              {isFetchingNextPage && <ProgressIcon otherProps={{ size: 24 }} />}
            </Box>
          )}
        </>
      )}
    </Stack>
  );
};

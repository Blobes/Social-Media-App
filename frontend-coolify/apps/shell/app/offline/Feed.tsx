"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { delay, clientRoutes, autoScroll } from "@repo/helpers";
import { Empty, GistSkeleton, StakeSkeleton } from "@repo/shared-ui";
import { CircleSlash2 } from "lucide-react";
import { usePage } from "@repo/shared-state";
import { getCachedPosts } from "@repo/helpers";
import { IPost } from "@repo/types";
import { GistCard, StakeCard } from "@repo/features";

export const CachedFeed = () => {
  const theme = useTheme();
  const [feed, setFeed] = useState<IPost[]>([]);
  const [isLoading, setLoading] = useState(false);
  const { navigateTo } = usePage();

  const handleFeed = useCallback(async () => {
    try {
      setLoading(true);
      const cachedPosts = await getCachedPosts();
      if (cachedPosts) setFeed(cachedPosts);
    } finally {
      await delay();
      setLoading(false);
    }
  }, [getCachedPosts]);

  useEffect(() => {
    handleFeed();
  }, [handleFeed]);

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
    <Stack sx={{ ...containerStyle }}>
      {isLoading ? (
        <>
          <GistSkeleton />
          <StakeSkeleton />
        </>
      ) : feed.length < 1 ? (
        <Empty
          headline="No offline posts"
          tagline="Can't find any post at this time."
          icon={<CircleSlash2 />}
          primaryCta={{
            type: "BUTTON",
            variant: "outlined",
            label: "Explore Funstakes",
            action: () =>
              navigateTo(clientRoutes.about, {
                type: "push",
                savePage: false,
                loadPage: true,
              }),
          }}
          style={{
            container: {
              height: "100%",
              backgroundColor: "none",
              alignItems: "center",
              justifyContent: "center",
            },
            tagline: { fontSize: "15px" },
            icon: {
              width: "50px",
              height: "50px",
              marginBottom: theme.boxSpacing(4),
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
              return <GistCard key={post._id} gist={post} mode="OFFLINE" />;
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

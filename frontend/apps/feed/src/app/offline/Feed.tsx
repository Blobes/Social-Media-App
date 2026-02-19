"use client";

import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useCallback, useEffect, useMemo, useState } from "react";
import { delay, clientRoutes } from "@funstakes/helpers";
import { ProgressIcon, Empty } from "@funstakes/shared-ui";
import { CircleSlash2 } from "lucide-react";
import { useStyles, usePage } from "@funstakes/hooks";
import { getCachedFeed } from "@funstakes/helpers";
import { IFeed } from "@funstakes/types";
import { sharedRegistry } from "@funstakes/helpers";


export const CachedFeed = () => {
  const theme = useTheme();
  const [feed, setFeed] = useState<IFeed[]>([]);
  const [isLoading, setLoading] = useState(false);
  const { navigateTo } = usePage();
  const { autoScroll } = useStyles();
  const GistCard = sharedRegistry.components['GistCard'];
  const StakeCard = sharedRegistry.components['StakeCard'];

  const handleFeed = useCallback(async () => {
    try {
      setLoading(true);
      const cachedPosts = await getCachedFeed();
      if (cachedPosts) setFeed(cachedPosts);
    } finally {
      await delay();
      setLoading(false);
    }
  }, [getCachedFeed])

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

  return isLoading ? (
    <Stack
      sx={{
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
      }}>
      <ProgressIcon otherProps={{ size: 24 }} />
    </Stack>
  ) : (feed.length < 1 ? (
    <Empty
      headline="No offline posts"
      tagline="Can't find any post at this time."
      icon={<CircleSlash2 />}
      primaryCta={{
        type: "BUTTON",
        variant: "outlined",
        label: "Explore Funstakes",
        action: () => navigateTo(clientRoutes.about,
          { type: "element", savePage: false, loadPage: true }),
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
  ) : (<Stack
    sx={{
      ...containerStyle
    }}>
    {feed.map((post) => {
      switch (post.type) {
        case "gist":
          return <GistCard key={post._id} gist={post} mode="offline" />
        case "stake":
          return <StakeCard key={post._id} stake={post} />
        default: <Typography>Post type not found</Typography>
      }
    })}
  </Stack>)
  )
}


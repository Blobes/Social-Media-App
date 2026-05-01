"use client";

import React, { useMemo } from "react";
import { Box, Stack } from "@mui/material";
import { CreateGist } from "../create/CreateGist";
import { Feedback, GistSkeleton, ProgressIcon } from "@repo/shared-ui";
import { Milestone } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { autoScroll } from "@repo/helpers";
import { GistCard, useGists } from "@repo/features";
import {
  useCachedData,
  useInfiniteScroll,
  usePageCache,
} from "@repo/shared-hooks";
import { IGist, CACHE_KEYS } from "@repo/core";

/**
 * Main Gists feed component.
 */
export const Gists = () => {
  const theme = useTheme();
  const {
    gists: onlineGists,
    rawData,
    message,
    isLoading,
    handleRefresh,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGists();

  const cachedGists = useCachedData<IGist>([CACHE_KEYS.POST.GISTS]);

  const { sentinelRef } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  // Activate progressive caching for the gist domain.
  usePageCache(rawData, CACHE_KEYS.POST.GISTS);

  const gists = onlineGists.length > 0 ? onlineGists : cachedGists;

  const containerStyle = useMemo(
    () => ({
      width: "100%",
      height: "100%",
      minWidth: "400px",
      gap: theme.gap(8),
      padding: theme.boxSpacing(8, 24),
      ...(gists.length > 1 && autoScroll().base),
      [theme.breakpoints.down("md")]: {
        border: "none",
        maxWidth: "unset",
        minWidth: "unset",
        padding: theme.boxSpacing(0),
        ...(!isLoading && autoScroll().mobile),
      },
    }),
    [theme, gists.length, isLoading],
  );

  return (
    <Stack sx={containerStyle}>
      <CreateGist />

      {isLoading ? (
        <GistSkeleton />
      ) : gists.length < 1 ? (
        <Feedback
          tagline={message || "No gists found in cache or online."}
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
          {gists.map((gist) => (
            <GistCard key={gist._id} gist={gist} />
          ))}

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

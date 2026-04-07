"use client";

import React, { useMemo } from "react";
import { Stack } from "@mui/material";
import { CreateGist } from "./CreateGist";
import { Empty, GistSkeleton } from "@repo/shared-ui";
import { Milestone } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { autoScroll } from "@repo/helpers";
import { GistCard, useGists } from "@repo/features";

export const Gists = () => {
  const theme = useTheme();
  const { gists, message, isLoading, handleRefresh } = useGists();

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
    [theme, gists.length, isLoading, autoScroll],
  );

  return (
    <Stack sx={containerStyle}>
      <CreateGist />

      {isLoading ? (
        <GistSkeleton />
      ) : gists.length < 1 ? (
        <Empty
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
        gists.map((gist) => <GistCard key={gist._id} gist={gist} />)
      )}
    </Stack>
  );
};

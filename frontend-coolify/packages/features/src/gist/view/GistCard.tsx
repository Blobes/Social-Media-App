"use client";

import React from "react";
import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  useGlobalContext,
  useAdaptiveTime,
  useSnackbar,
  useMisc,
} from "@repo/shared-hooks";
import { UIMode, IGist, MediaProps, GenericStyle } from "@repo/core";
import { mediaData } from "@repo/assets";
import { Feedback, PostObserver, WordTrimmer } from "@repo/shared-ui";
import { GistService } from "../gistService";
import { GistMedia } from "./GistMedia";
import { PostHeader } from "../../post/components/header/PostHeader";
import { Metrics } from "../../post/components/Metrics";
import { PostEngagement } from "../../post/components/engagement/Engagement";
import { usePostLike as useGistLike } from "../../post/hooks/usePostLike";
import { useCached } from "../../post/hooks/useCached";

interface GistProps {
  gist: IGist;
  style?: GenericStyle;
  mode?: UIMode;
}
export const GistCard = ({ gist, style = {}, mode = "ONLINE" }: GistProps) => {
  const theme = useTheme();
  const { setSBMessage } = useSnackbar();
  const { fetchGistLike, getPendingLike, setPendingLike, clearPendingLike } =
    GistService();
  const { authStatus, setModalContent } = useGlobalContext();
  const { isOffline, isUnstableNetwork } = useMisc();

  const {
    postData: gistData,
    isLiking,
    handleLike,
  } = useGistLike(gist, fetchGistLike, {
    getPendingLike,
    setPendingLike,
    clearPendingLike,
    authStatus,
    setModalContent,
    isOffline,
    isUnstableNetwork,
    setSBMessage,
    mode,
    LoginPrompt: <Typography>Login to engage</Typography>,
  });

  const {
    likeCount,
    likedByMe,
    latestCaption,
    media,
    authorId,
    author,
    createdAt,
  } = gistData;

  const gistMedia: MediaProps[] =
    media && media.length > 0 ? (media as MediaProps[]) : mediaData;

  // Gist Author logic
  const { cachedAuthor } = useCached(authorId);
  const gistAuthor = mode === "ONLINE" || !cachedAuthor ? author : cachedAuthor;

  if (gistData.status === "DELETED")
    return <Feedback tagline="Deleted by author." />;

  // Prepare Metrics Data
  const postMetrics = [
    { label: "Like", count: likeCount, plural: "Likes" },
    { label: "Reply", count: 1500, plural: "Replies" },
    { label: "View", count: 20000, plural: "Views" },
  ];

  return (
    <PostObserver post={gistData} type="GIST">
      <Stack
        sx={{
          gap: 0,
          flexGrow: "0",
          flexShrink: "0",
          borderBottom: `1px solid ${theme.palette.gray.trans[1]}`,
          ...style,
        }}>
        {/* 1. Header Molecule */}
        <PostHeader
          authorProps={{
            author: gistAuthor,
            avatarSize: "36px",
          }}
          actionProps={{
            createdAt,
            useActions: { useAdaptiveTime: () => useAdaptiveTime },
            onMore: () => console.log("Open Menu"),
            onFollow: () => console.log("Follow User"),
          }}
        />

        {/* 2. Caption/Content Molecule */}
        <WordTrimmer
          text={latestCaption.caption}
          style={{
            container: {
              padding: theme.boxSpacing(4, 0),
              [theme.breakpoints.down("md")]: {
                padding: theme.boxSpacing(4, 6),
              },
            },
          }}
        />

        {/* 3. Media Molecule */}
        <GistMedia
          gist={gistData}
          mediaList={gistMedia}
          isLiking={isLiking}
          mode={mode}
          handleLike={handleLike}
        />

        {/* 4. Metrics Molecule (replaces the raw Strip) */}
        <Metrics
          metrics={postMetrics}
          sx={{
            borderBottom: `1px solid ${theme.palette.gray.trans[1]}`,
          }}
        />

        {/* 5. Engagement Molecule */}
        <PostEngagement
          like={{ likedByMe, isLiking, handleLike, mode }}
          reply={{ onClick: () => console.log("Reply clicked") }}
          share={{ onClick: () => console.log("Share clicked") }}
          bookmark={{
            bookmarked: false,
            onClick: () => console.log("Bookmark toggled"),
          }}
        />
      </Stack>
    </PostObserver>
  );
};

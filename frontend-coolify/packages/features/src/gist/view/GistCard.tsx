"use client";

import React from "react";
import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  useAdaptiveTime,
  useSnackbar,
  useMisc,
  useGlobalStore,
  useGistStore,
  useCachedData,
} from "@repo/shared-hooks";
import {
  UIMode,
  IGist,
  MediaProps,
  GenericStyle,
  IPost,
  IPostAuthor,
  QUERY_KEYS,
} from "@repo/core";
import { mediaData } from "@repo/assets";
import { Feedback, WordTrimmer } from "@repo/shared-ui";
import { GistService } from "../gistService";
import { GistMedia } from "./GistMedia";
import { PostHeader } from "../../post/components/header/PostHeader";
import { Metrics } from "../../post/components/Metrics";
import { PostEngagement } from "../../post/components/engagement/Engagement";
import { usePostLike as useGistLike } from "../../post/hooks/usePostLike";
import { usePostSeen } from "../../post/hooks/usePostSeen";

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
  const authStatus = useGlobalStore((state) => state.authStatus);
  const setModalContent = useGlobalStore((state) => state.setModalContent);
  const { isOffline, isUnstableNetwork } = useMisc();

  // Inside GistCard component...
  const updateGistLike = useGistStore((state) => state.updateGistLike);

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
    updateStore: updateGistLike, // Passing the specific Zustand updater
    queryKey: [QUERY_KEYS.POST.GISTS], // Passing the TanStack query key
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

  // Look into the TanStack cache to mark this post as seen when scrolled into view.
  // const { elementRef } = usePostSeen(gistData as unknown as IPost);

  // const { elementRef } = usePostSeen<IGist>(gistData, ["gists"]);
  const { elementRef } = usePostSeen<IPost>(gistData as IPost, [
    QUERY_KEYS.POST.GISTS,
  ]);

  const gistMedia: MediaProps[] =
    media && media.length > 0 ? (media as MediaProps[]) : mediaData;

  // Gist Author logic
  //const { cachedAuthor } = useCached(authorId);
  // const cachedAuthor = useCachedData<IPostAuthor>(["author"]);
  // const gistAuthor = mode === "ONLINE"  ? author : cachedAuthor;

  if (gistData.status === "DELETED")
    return <Feedback tagline="Deleted by author." />;

  // Prepare Metrics Data
  const postMetrics = [
    { label: "Like", count: likeCount, plural: "Likes" },
    { label: "Reply", count: 1500, plural: "Replies" },
    { label: "View", count: 20000, plural: "Views" },
  ];

  return (
    <Stack
      ref={elementRef as React.RefObject<HTMLDivElement>}
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
          author: author,
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
  );
};

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
} from "@repo/shared-hooks";
import {
  UIMode,
  IGist,
  MediaProps,
  GenericStyle,
  IPost,
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
  const updateGistLike = useGistStore((state) => state.updateGistLike);

  /**
   * Only like-related state is owned by the like hook.
   * Everything else continues to come from the original gist object.
   */
  const { likedByMe, likeCount, isLiking, handleLike, canInteract } =
    useGistLike(
      {
        _id: gist._id,
        likedByMe: gist.likedByMe,
        likeCount: gist.likeCount,
        status: gist.status,
      },
      fetchGistLike,
      {
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
        updateStore: updateGistLike,
        queryKey: [QUERY_KEYS.POST.GISTS],
      },
    );

  // Build the render model by merging the static gist fields with the live like state.
  const gistData: IGist = {
    ...gist,
    likedByMe,
    likeCount,
  };

  const { latestCaption, media, author, createdAt } = gistData;

  const { elementRef } = usePostSeen<IPost>(gistData as IPost, [
    QUERY_KEYS.POST.GISTS,
  ]);

  const gistMedia: MediaProps[] = media && media.length > 0 ? media : mediaData;

  if (gistData.status === "DELETED") {
    return <Feedback tagline="Deleted by author." />;
  }

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
      <PostHeader
        authorProps={{
          author,
          avatarSize: "36px",
        }}
        actionProps={{
          createdAt,
          useActions: { useAdaptiveTime: () => useAdaptiveTime },
          onMore: () => console.log("Open Menu"),
        }}
      />

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

      <GistMedia
        gist={gistData}
        mediaList={gistMedia}
        mode={mode}
        likeState={{
          likedByMe,
          likeCount,
          isLiking,
          handleLike,
          canInteract,
        }}
      />

      <Metrics
        metrics={postMetrics}
        sx={{
          borderBottom: `1px solid ${theme.palette.gray.trans[1]}`,
        }}
      />

      <PostEngagement
        like={{ likedByMe, isLiking, handleLike, mode, count: likeCount }}
        reply={{ onClick: () => console.log("Reply clicked") }}
        share={{ onClick: () => console.log("Share clicked") }}
        bookmark={{
          bookmarked: false,
          onClick: () => console.log("Bookmark toggled"),
        }}
        follow={{
          onClick: () => console.log("Follow clicked"),
        }}
      />
    </Stack>
  );
};

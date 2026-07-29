"use client";

import React from "react";
import { useTheme } from "@mui/material/styles";
import { useAdaptiveTime, useMisc } from "@repo/shared-hooks";
import { IsolatedMedia } from "@repo/shared-ui";
import { IGist, MediaProps, UIMode } from "@repo/core";
import { LikeState } from "./GistMedia";
import { useGistLikeState } from "./hooks/useGistState";
import { DynamicCaption } from "../../post/components/Caption";
import { PostHeader } from "../../post/components/header/PostHeader";
import { PostEngagement } from "../../post/components/engagement/Engagement";
import { PostService } from "../../post/postService";

interface ViewProps {
  gist: IGist;
  initialIndex: number;
  mode: UIMode;
  mediaList: MediaProps[];
  likeState: LikeState;
}

export const GistMediaView = ({
  gist,
  mode,
  initialIndex,
  mediaList,
  likeState,
}: ViewProps) => {
  const theme = useTheme();
  const { isDesktop } = useMisc();
  const { localLikeState, localIsLiking, handleGistLike } =
    useGistLikeState(likeState);
  const { translateText } = PostService();

  const { author, createdAt, latestCaption, media } = gist;
  const { likedByMe, likeCount } = localLikeState;

  const postHeader = (
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
  );

  const postEngagement = (
    <PostEngagement
      variant="VERTICAL"
      like={{
        likedByMe,
        isLiking: localIsLiking,
        handleLike: handleGistLike,
        mode,
        count: likeCount,
      }}
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
  );

  const postCaption = (
    <DynamicCaption
      captionId={latestCaption.captionId}
      caption={latestCaption.caption}
      detectedLanguage={latestCaption.detectedLanguage}
      transServiceFn={{ translateServiceFn: translateText }}
    />
  );

  return (
    <IsolatedMedia
      mediaList={mediaList || media}
      postHeader={postHeader}
      postEngagment={postEngagement}
      postCaption={postCaption}
      isDesktop={isDesktop}
      onDoubleTap={handleGistLike}
      initialIndex={initialIndex}
    />
  );
};

"use client";

import React from "react";
import { useTheme } from "@mui/material/styles";
import { useAdaptiveTime, useMisc } from "@repo/shared-state";
import { IsolatedMedia } from "@repo/shared-ui";
import { IGist, UIMode } from "@repo/core";
import { PostEngagement } from "../../post/components/engagement/Engagement";
import { PostHeader } from "../../post/components/header/PostHeader";
import { PostCaption } from "../../post/components/Caption";

interface Like {
  isLiking: boolean;
  handleLike: () => void;
}

interface ViewProps {
  gist: IGist;
  like: Like;
  initialIndex: number;
  mode: UIMode;
}

export const GistMediaView = ({
  gist,
  like,
  mode,
  initialIndex,
}: ViewProps) => {
  const theme = useTheme();
  const { isDesktop } = useMisc();

  const { handleLike, isLiking } = like;

  // Destructure required data from the gist object
  const { author, createdAt, latestCaption, likeCount, media, likedByMe } =
    gist;

  const postHeader = (
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
  );

  const postEngagment = (
    <PostEngagement
      variant="VERTICAL"
      like={{ likedByMe, isLiking, handleLike, mode, count: likeCount }}
      reply={{ onClick: () => console.log("Reply clicked") }}
      share={{ onClick: () => console.log("Share clicked") }}
      bookmark={{
        bookmarked: false,
        onClick: () => console.log("Bookmark toggled"),
      }}
    />
  );

  const postCaption = (
    <PostCaption
      caption={latestCaption.caption}
      limit={200}
      style={{
        padding: theme.boxSpacing(4, 0),
        [theme.breakpoints.down("md")]: {
          padding: theme.boxSpacing(4, 6),
        },
      }}
    />
  );

  return (
    <IsolatedMedia
      mediaList={media}
      postHeader={postHeader}
      postEngagment={postEngagment}
      postCaption={postCaption}
      isDesktop={isDesktop}
      onDoubleTap={handleLike}
      initialIndex={initialIndex}
    />
  );
};

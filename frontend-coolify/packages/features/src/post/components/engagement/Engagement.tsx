"use client";

import React from "react";
import { Stack, Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LikeButton, LikeProps } from "./Like";
import { BookmarkButton, BookmarkProps } from "./Bookmark";
import { ShareButton, ShareProps } from "./Share";
import { ReplyButton, ReplyProps } from "./Reply";
import { summarizeNum } from "@repo/helpers";
import { GenericStyle } from "@repo/core";

interface Hide {
  like?: boolean;
  share?: boolean;
  reply?: boolean;
  bookmark?: boolean;
}

export interface EngagementProps {
  like: LikeProps & { count?: number };
  reply: ReplyProps & { count?: number };
  bookmark: BookmarkProps & { count?: number };
  share: ShareProps & { count?: number };
  hide?: Hide;
  addition?: React.ReactNode;
  variant?: "HORIZONTAL" | "VERTICAL";
  style?: GenericStyle;
}

export const PostEngagement = ({
  like,
  reply,
  bookmark,
  share,
  hide = {},
  addition,
  variant = "HORIZONTAL",
  style,
}: EngagementProps) => {
  const theme = useTheme();
  const isVertical = variant === "VERTICAL";

  // Helper to conditionally render metrics based on variant
  const renderAction = (ButtonComponent: React.ReactNode, count?: number) => (
    <Stack alignItems="center" spacing={0.5}>
      {ButtonComponent}
      {isVertical && count !== undefined && (
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            fontSize: "11px",
            color: theme.palette.gray[200],
            // Added shadow for visibility if overlaid on media
            textShadow: "0px 1px 2px rgba(0,0,0,0.5)",
          }}>
          {summarizeNum(count)}
        </Typography>
      )}
    </Stack>
  );

  return (
    <Stack
      direction={isVertical ? "column" : "row"}
      justifyContent={isVertical ? "center" : "space-between"}
      alignItems="center"
      sx={{
        width: isVertical ? "auto" : "100%",
        padding: isVertical ? theme.boxSpacing(2) : theme.boxSpacing(6, 0),
        [theme.breakpoints.down("md")]: {
          padding: isVertical ? theme.boxSpacing(2) : theme.boxSpacing(4, 6),
        },
        ...style,
      }}>
      {/* Main Action Group */}
      <Stack
        sx={{
          flexDirection: isVertical ? "column" : "row",
          gap: isVertical ? theme.gap(4) : theme.gap(6),
          alignItems: "center",
        }}>
        {!hide.like &&
          renderAction(
            <LikeButton
              likedByMe={like.likedByMe}
              isLiking={like.isLiking}
              handleLike={like.handleLike}
              mode={like.mode}
            />,
            like.count,
          )}

        {!hide.reply &&
          renderAction(
            <ReplyButton onClick={reply.onClick} size={reply.size} />,
            reply.count,
          )}

        {!hide.share &&
          renderAction(
            <ShareButton onClick={share.onClick} size={share.size} />,
            share.count,
          )}

        {/* In Vertical variant, Bookmark lives inside the main stack */}
        {isVertical &&
          !hide.bookmark &&
          renderAction(
            <BookmarkButton
              bookmarked={bookmark.bookmarked}
              onClick={bookmark.onClick}
              size={bookmark.size}
            />,
            bookmark.count,
          )}
      </Stack>

      {addition && addition}

      {/* In Horizontal variant, Bookmark is pushed to the far right */}
      {!isVertical && !hide.bookmark && (
        <Box>
          <BookmarkButton
            bookmarked={bookmark.bookmarked}
            onClick={bookmark.onClick}
            size={bookmark.size}
          />
        </Box>
      )}
    </Stack>
  );
};

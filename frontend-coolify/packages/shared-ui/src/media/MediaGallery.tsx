"use client";

import React, { useMemo } from "react";
import { Box, ImageList, ImageListItem, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DoubleTap } from "../DoubleTap";
import Image from "next/image";
import { VideoMedia } from "./VideoMedia";
import { MediaProps, MediaStyle } from "@repo/core";

export interface GalleryProps {
  mediaList: MediaProps[];
  style?: MediaStyle;
  bgEffects?: any;
}

export const MediaGallery = ({ mediaList, style, bgEffects }: GalleryProps) => {
  const theme = useTheme();

  // 1. Define patterns to ensure the 4-column grid is always full
  const LAYOUT_PATTERNS: Record<number, { cols: number; rows: number }[]> = {
    1: [{ cols: 4, rows: 2 }],
    2: [
      { cols: 2, rows: 2 },
      { cols: 2, rows: 2 },
    ],
    3: [
      { cols: 4, rows: 2 },
      { cols: 2, rows: 1 },
      { cols: 2, rows: 1 },
    ],
    4: [
      { cols: 2, rows: 2 },
      { cols: 2, rows: 1 },
      { cols: 2, rows: 1 },
      { cols: 4, rows: 1 },
    ],
    5: [
      { cols: 2, rows: 2 },
      { cols: 2, rows: 1 },
      { cols: 2, rows: 1 },
      { cols: 2, rows: 1 },
      { cols: 2, rows: 1 },
    ],
    6: [
      { cols: 2, rows: 2 },
      { cols: 2, rows: 1 },
      { cols: 2, rows: 1 },
      { cols: 1, rows: 1 },
      { cols: 1, rows: 1 },
      { cols: 2, rows: 1 },
    ],
  };

  const displayMedia = useMemo(() => {
    const mediaItems = [...mediaList].sort((a, b) =>
      (a._id || a.url).localeCompare(b._id || b.url),
    );
    const count = Math.min(mediaItems.length, 5);
    const sliced = mediaItems.slice(0, count);
    const pattern = LAYOUT_PATTERNS[count];

    return sliced.map((item, index) => ({
      ...item,
      rows: pattern[index].rows,
      cols: pattern[index].cols,
    }));

    // Only re-run if the actual list of media changes (e.g., a new post)
  }, [mediaList]);

  const remainingCount = mediaList.length - 5;

  return (
    <ImageList
      sx={{
        width: "100%",
        height: "auto",
        borderRadius: theme.radius[2],
        overflow: "hidden",
        bgcolor: theme.palette.gray.trans[1],
        margin: 0,
        ...style?.container?.base,
        [theme.breakpoints.down("md")]: {
          ...style?.container?.smallScreen,
        },
      }}
      variant="quilted"
      cols={4}
      rowHeight={150}>
      {displayMedia.map((media, index) => {
        const isLastItem = index === 4 && remainingCount > 0;
        const {
          _id,
          ownerId,
          url,
          type,
          alt,
          onSingleTap,
          onDoubleTap,
          cols,
          rows,
        } = media;
        const mediaType = type ?? "IMAGE";

        return (
          <ImageListItem
            key={_id}
            cols={cols}
            rows={rows}
            sx={{
              position: "relative",
              overflow: "hidden",
              cursor: "pointer",
              ...bgEffects(theme).zoom("& video, & img"),
            }}>
            <DoubleTap
              onSingleTap={() => onSingleTap && onSingleTap()}
              onDoubleTap={() => onDoubleTap && onDoubleTap()}
              style={{ ...(!isLastItem && bgEffects(theme).overlay) }}>
              {mediaType === "VIDEO" ? (
                <VideoMedia
                  _id={_id}
                  ownerId={ownerId}
                  url={url}
                  style={style?.content}
                />
              ) : (
                <Image
                  src={url}
                  width={0}
                  height={0}
                  sizes="100vw"
                  loading="lazy"
                  alt={alt || "Post image"}
                  style={{ ...style?.content }}
                />
              )}
              {isLastItem && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: theme.palette.gray.trans.overlay(0.6),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    zIndex: 2,
                    padding: theme.boxSpacing(4),
                    color: theme.fixedColors.gray50,
                  }}>
                  <Typography variant="h6" textAlign="center">
                    +{remainingCount}
                  </Typography>
                </Box>
              )}
            </DoubleTap>
          </ImageListItem>
        );
      })}
    </ImageList>
  );
};

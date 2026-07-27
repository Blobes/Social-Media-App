"use client";

import React, { CSSProperties, useMemo } from "react";
import { Box, ImageList, ImageListItem } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ElementTap } from "../../ElementTap";
import Image from "next/image";
import { VideoMedia } from "./VideoMedia";
import { COMMON_MEDIA, MediaProps, MediaStyle } from "@repo/core";
import { TransText } from "../../Text";
import { MediaRenderer } from "./MediaRenderer";

export interface GalleryProps {
  mediaList: MediaProps[];
  style?: MediaStyle;
  bgEffects?: any;
}

export const MediaGrid = ({ mediaList, style, bgEffects }: GalleryProps) => {
  const theme = useTheme();

  // 1. Define patterns to ensure the 4-column grid is always full
  const LAYOUT_CONFIG: Record<number, { cols: number; rows: number }[]> = {
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
    const pattern = LAYOUT_CONFIG[count];

    return sliced.map((item, index) => ({
      ...item,
      rows: pattern[index].rows,
      cols: pattern[index].cols,
    }));
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
        const { _id, onSingleTap, onDoubleTap, cols, rows } = media;
        // const mediaType = type ?? "IMAGE";

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
            <ElementTap
              onSingleTap={() => onSingleTap && onSingleTap()}
              onDoubleTap={() => onDoubleTap && onDoubleTap()}
              style={{ ...(!isLastItem && bgEffects(theme).overlay) }}>
              <MediaRenderer
                media={media}
                width={0}
                height={0}
                excludeBlurHash
                style={{
                  content: {
                    // width: "100%",
                    // height: "100%",
                    // maxHeight: "none",
                    // maxWidth: "none",
                    // objectFit: "cover",
                    ...style?.content,
                  },
                  container: {
                    base: {
                      width: "100%",
                      height: "100%",
                      aspectRatio: "unset",
                    },
                  },
                }}
              />

              {/* {mediaType === "VIDEO" ? (
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
                  style={{ ...(style?.content as CSSProperties) }}
                />
              )} */}
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
                  <TransText
                    {...COMMON_MEDIA.remaining_count}
                    sx={{ ...theme.typography.h6, textAlign: "center" }}
                  />
                </Box>
              )}
            </ElementTap>
          </ImageListItem>
        );
      })}
    </ImageList>
  );
};

/**
 * Standardized horizontal scrolling strip for multi-media rendering on small viewports.
 */
export const MediaScroll = ({ mediaList, style, bgEffects }: GalleryProps) => {
  const theme = useTheme();

  // Guard against missing files or unexpected single items since they are processed separately
  if (!mediaList || mediaList.length <= 1) return null;

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "row",
        gap: theme.gap(3),
        overflowX: "auto",
        overflowY: "hidden",
        WebkitOverflowScrolling: "touch",
        paddingBottom: theme.gap(1), // Prevents scrollbar from clipping item bounds
        scrollbarWidth: "none", // Keeps viewport clean on Firefox
        "&::-webkit-scrollbar": {
          display: "none", // Keeps viewport clean on Chrome/Safari
        },
        ...style?.container?.base,
        [theme.breakpoints.down("md")]: {
          ...style?.container?.smallScreen,
        },
      }}>
      {mediaList.map((media) => {
        const { _id, ownerId, url, type, alt, onSingleTap, onDoubleTap } =
          media;
        const mediaType = type ?? "IMAGE";

        return (
          <Box
            key={_id || url}
            sx={{
              position: "relative",
              flex: "0 0 auto",
              width: "calc(85% - 12px)",
              maxWidth: "340px",
              height: "280px",
              borderRadius: theme.radius[2],
              overflow: "hidden",
              backgroundColor: theme.palette.gray.trans[1],
              ...bgEffects?.(theme)?.zoom?.("& video, & img"),
            }}>
            <ElementTap
              onSingleTap={() => onSingleTap && onSingleTap()}
              onDoubleTap={() => onDoubleTap && onDoubleTap()}
              style={{ ...bgEffects?.(theme)?.overlay }}>
              {mediaType === "VIDEO" ? (
                <VideoMedia
                  _id={_id}
                  ownerId={ownerId}
                  url={url}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    ...style?.content,
                  }}
                />
              ) : (
                <Image
                  src={url}
                  width={0}
                  height={0}
                  sizes="(max-width: 768px) 100vw, 340px"
                  loading="lazy"
                  alt={alt || "Post image"}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    ...(style?.content as CSSProperties),
                  }}
                />
              )}
            </ElementTap>
          </Box>
        );
      })}
    </Box>
  );
};

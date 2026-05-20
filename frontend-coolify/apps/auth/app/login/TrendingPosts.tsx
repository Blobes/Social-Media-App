"use client";

import React from "react";
import { IPost, GenericStyle } from "packages/core";
import { useAdaptiveTime } from "packages/shared-hooks";
import { useTheme } from "@mui/material/styles";
import {
  Carousel,
  GistSkeleton,
  SmartDate,
  SVGWrapper,
} from "packages/shared-ui";
import { useTrendingData } from "./hooks/usePostTrends";
import { Box, Stack, Typography } from "@mui/material";
import { lineClamp, summarizeNum } from "packages/helpers";

interface TrendingPost {
  post: IPost;
  avatar: string;
  bgColor: string;
  caption: string;
}

/**
 * Individual trending post layout card supporting rich image and embedded video backgrounds.
 */
const TrendingPostCard = ({ data }: { data: TrendingPost }) => {
  const theme = useTheme();
  const hasMedia = data.post.media && data.post.media.length > 0;
  const targetMedia = hasMedia ? data.post.media[0] : null;
  const isVideo =
    targetMedia?.mimeType?.startsWith("video/") ||
    targetMedia?.url?.endsWith(".mp4");

  return (
    <Stack
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 350,
        alignItems: "flex-start",
        justifyContent: "flex-end",
        borderRadius: theme.radius[5] || "24px",
        overflow: "hidden",
        background: data.bgColor,
        gap: theme.gap(18),
        p: theme.boxSpacing(22, 18, 18, 18),
      }}>
      {/* Background Visual Rendering Block */}
      {hasMedia && targetMedia && (
        <Box sx={{ position: "absolute", inset: 0, zIndex: 1 }}>
          {isVideo ? (
            <Box
              component="video"
              src={targetMedia.url}
              autoPlay
              loop
              muted
              playsInline
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Box
              component="img"
              src={targetMedia.url}
              alt="Post asset background"
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
          {/* Overlay to preserve text contrast readability */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)",
            }}
          />
        </Box>
      )}

      {/* Main Content Fields */}
      <Typography
        variant="h6"
        sx={{
          zIndex: 2,
          position: "relative",
          color: "#FFFFFF",
          lineHeight: 1.4,
          ...lineClamp(4),
          textShadow: "0px 2px 8px rgba(0,0,0,0.2)",
        }}>
        {data.caption}
      </Typography>

      {/* Engagement Footer Details */}
      <Box
        sx={{
          zIndex: 2,
          position: "relative",
          display: "flex",
          alignItems: "flex-start",
          gap: theme.gap(6),
        }}>
        <SVGWrapper
          src={data.avatar}
          size={50}
          preserveColor={true}
          sx={{
            flex: 1,
            border: "2px solid #FFFFFF",
            borderRadius: theme.radius.full,
            overflow: "hidden",
            [theme.breakpoints.down("md")]: {
              width: 38,
              height: 38,
            },
          }}
        />
        <Box>
          <Typography
            variant="body2"
            sx={{
              fontSize: theme.typography.body2,
              color: "#FFFFFF",
              fontWeight: 500,
            }}>
            {data.post.postType === "GIST"
              ? `${summarizeNum(data.post.likeCount) || 0} likes`
              : "Active stake"}
          </Typography>
          {data.post.postType === "GIST" ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                color: "rgba(255,255,255,0.7)",
              }}>
              <Typography
                component="span"
                sx={{ ...theme.typography.caption, color: "inherit" }}>
                Shared
              </Typography>
              <SmartDate
                variant="caption"
                timestamp={data.post.createdAt}
                adaptiveTime={useAdaptiveTime}
                sx={{
                  padding: theme.boxSpacing(0, 4),
                  width: "fit-content",
                  flex: "none",
                  color: "inherit",
                }}
              />
              <Typography
                component="span"
                sx={{ ...theme.typography.caption, color: "inherit" }}>
                with {summarizeNum(data.post.viewCount) || 0} views
              </Typography>
            </Box>
          ) : (
            <Typography
              sx={{
                ...theme.typography.caption,
                color: "rgba(255,255,255,0.7)",
                display: "block",
              }}>
              Shared trending post
            </Typography>
          )}
        </Box>
      </Box>
    </Stack>
  );
};

/**
 * Complete side landing wrapper managing title headers and core carousels.
 */
export const TrendingPosts = ({ style }: { style?: GenericStyle }) => {
  const theme = useTheme();
  const { processedPosts, isLoading } = useTrendingData();

  const carouselItems = processedPosts.map((item) => (
    <TrendingPostCard key={item.post._id} data={item} />
  ));

  return (
    <Box
      sx={{
        width: style?.width || "100%",
        maxWidth: 480,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: theme.gap(20),
        padding: theme.boxSpacing(24),
        margin: "0 auto",
      }}>
      {isLoading ? (
        <GistSkeleton quantity={1} />
      ) : carouselItems.length < 0 ? (
        <>
          <Typography
            component="h5"
            variant="h6"
            sx={{
              width: "100%",
              color: theme.palette.primary.main,
              textAlign: "center",
            }}>
            Trends you might have missed while away!
          </Typography>
          <Carousel
            items={carouselItems}
            // autoPlay={true}
            pauseOnHover={true}
            interval={10000}
          />
        </>
      ) : (
        <Typography
          variant="h4"
          sx={{
            width: "100%",
            color: theme.palette.gray[300],
          }}>
          "Something Must Be Unique About You!" ~ Funstakes
        </Typography>
      )}
    </Box>
  );
};

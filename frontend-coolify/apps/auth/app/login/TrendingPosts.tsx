"use client";

import React from "react";
import { IPost, GenericStyle } from "@repo/core";
import { useAdaptiveTime } from "@repo/shared-hooks";
import { useTheme } from "@mui/material/styles";
import {
  Carousel,
  LinearCarousel,
  GistSkeleton,
  SmartDate,
  SVGWrapper,
  StackedCarousel,
} from "@repo/shared-ui";
import { useTrendingData } from "./hooks/usePostTrends";
import { Box, Stack, Typography } from "@mui/material";
import { applyBGPattern, lineClamp, summarizeNum } from "@repo/helpers";
import { Quote } from "lucide-react";
import { asset } from "@repo/assets";

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
        minHeight: 300,
        alignItems: "flex-start",
        justifyContent: "flex-end",
        borderRadius: theme.radius[5] || "24px",
        background: data.bgColor,
        ...(!hasMedia && applyBGPattern({ url: asset.bgNoise, contain: true })),
        gap: theme.gap(18),
        padding: theme.boxSpacing(22, 18, 18, 18),
        [theme.breakpoints.down("sm")]: {
          gap: theme.gap(14),
          padding: theme.boxSpacing(18, 14, 14, 14),
        },
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
        component="h5"
        variant="subtitle1"
        sx={{
          zIndex: 2,
          position: "relative",
          color: "#FFFFFF",
          lineHeight: 1.4,
          ...lineClamp(6),
          textShadow: hasMedia ? "0px 2px 8px rgba(0,0,0,0.2)" : "none",
          [theme.breakpoints.down("md")]: {
            fontSize: 22,
          },
        }}>
        {data.caption}
      </Typography>

      {/* Engagement Footer Details */}
      <Box
        sx={{
          zIndex: 2,
          color: "#FFFFFF",
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: theme.gap(6),
        }}>
        <SVGWrapper
          src={data.avatar}
          size={50}
          preserveColor={true}
          sx={{
            flex: "none",
            border: "2px solid #FFFFFF",
            borderRadius: theme.radius.full,
            overflow: "hidden",
            [theme.breakpoints.down("md")]: {
              width: 44,
              height: 44,
            },
          }}
        />
        <Box>
          <Typography
            variant="body1"
            sx={{
              color: "inherit",
            }}>
            {data.post.postType === "GIST"
              ? `${summarizeNum(data.post.likeCount) || 0} 
              ${data.post.likeCount > 1 ? "likes" : "like"}`
              : "Active stake"}
          </Typography>
          {data.post.postType === "GIST" ? (
            <Typography
              component="span"
              variant="body3"
              sx={{
                color: "inherit",
                width: "100%",
                ...lineClamp(1),
              }}>
              <SmartDate
                component="span"
                variant="body3"
                timestamp={data.post.createdAt}
                adaptiveTime={useAdaptiveTime}
                sx={{
                  padding: theme.boxSpacing(0, 2),
                  color: "inherit",
                }}
              />
              ago | {summarizeNum(data.post.viewCount) || 0} views
            </Typography>
          ) : (
            <Typography
              variant="body3"
              sx={{
                color: "inherit",
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
        width: "50%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.gap(16),
        padding: theme.boxSpacing(18, 20),
        margin: "0 auto",
        backgroundColor: theme.palette.gray[300],
        overflow: "hidden",
        ...style?.container,
        [theme.breakpoints.down("md")]: {
          width: "100%",
          height: "100vh",
          minHeight: "fit-content",
          scrollSnapAlign: "start",
          padding: theme.boxSpacing(20, 10),
          flex: "none",
          ...style?.container?.smallScreen,
        },
      }}>
      {isLoading ? (
        <GistSkeleton quantity={1} />
      ) : carouselItems.length > 0 ? (
        <>
          <Typography
            component="h5"
            variant="h6"
            sx={{
              width: "100%",
              color: theme.palette.primary.light,
              fontWeight: 700,
              textAlign: "center",
              [theme.breakpoints.down("md")]: {
                fontSize: 26,
                lineHeight: "1.4em",
              },
            }}>
            Trends you might have missed while away.
          </Typography>
          <LinearCarousel
            items={carouselItems}
            // isMultiView={false}
            autoPlay
            pauseOnHover
            interval={7000}
            style={{
              container: {
                width: "35cqw",
                height: "76%",
                [theme.breakpoints.only("md")]: {
                  width: "40cqw",
                },
                [theme.breakpoints.down("md")]: {
                  width: "100cqw",
                  height: "60%",
                },
              },
            }}
          />
        </>
      ) : (
        <>
          <Quote size={50} />
          <Stack gap={theme.gap(8)} alignItems="center">
            <Typography
              variant="h6"
              sx={{
                textAlign: "center",
                width: "80%",
                color: theme.palette.gray[0],
                lineHeight: "1.4em",
              }}>
              Something Must Be Unique About You
            </Typography>
            <Typography
              variant="body1"
              sx={{
                width: "100%",
                textAlign: "center",
                color: theme.palette.primary.light,
                fontWeight: "600",
              }}>
              ~ Funstakes
            </Typography>
          </Stack>
        </>
      )}
    </Box>
  );
};

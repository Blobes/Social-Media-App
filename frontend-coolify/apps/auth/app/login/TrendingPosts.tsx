"use client";

import React from "react";
import { IPost, GenericStyle } from "@repo/core";
import { useAdaptiveTime } from "@repo/shared-hooks";
import { useTheme } from "@mui/material/styles";
import { Carousel, GistSkeleton, SmartDate, SVGWrapper } from "@repo/shared-ui";
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
        overflow: "hidden",
        background: data.bgColor,
        ...(!hasMedia && applyBGPattern({ url: asset.bgNoise, contain: true })),
        gap: theme.gap(18),
        padding: theme.boxSpacing(22, 18, 18, 18),
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
          ...lineClamp(5),
          textShadow: hasMedia ? "0px 2px 8px rgba(0,0,0,0.2)" : "none",
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
          alignItems: "flex-start",
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
              width: 38,
              height: 38,
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
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
              }}>
              <Typography
                component="span"
                variant="body3"
                sx={{
                  color: "inherit",
                }}>
                Shared
              </Typography>
              <SmartDate
                variant="body3"
                timestamp={data.post.createdAt}
                adaptiveTime={useAdaptiveTime}
                sx={{
                  padding: theme.boxSpacing(0, 2),
                  width: "fit-content",
                  flex: "none",
                  color: "inherit",
                }}
              />
              <Typography
                variant="body3"
                component="span"
                sx={{ color: "inherit" }}>
                ago with {summarizeNum(data.post.viewCount) || 0} views
              </Typography>
            </Box>
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
        width: style?.width || "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.gap(16),
        padding: theme.boxSpacing(18, 20),
        margin: "0 auto",
        backgroundColor: theme.palette.gray[300],
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
              textAlign: "center",
              [theme.breakpoints.down("md")]: { fontSize: 28 },
            }}>
            Trends you might have missed while away.
          </Typography>
          <Carousel
            items={carouselItems}
            autoPlay={true}
            pauseOnHover={true}
            interval={7000}
            style={{
              container: {
                height: "70%",
                [theme.breakpoints.only("sm")]: {
                  width: "70%",
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

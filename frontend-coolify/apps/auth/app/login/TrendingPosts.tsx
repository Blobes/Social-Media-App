"use client";

import React from "react";
import { IPost, GenericStyle, COMMON_FEEDBACK, POST_INFO } from "@repo/core";
import { useAdaptiveTime } from "@repo/shared-hooks";
import { useTheme } from "@mui/material/styles";
import {
  LinearCarousel,
  GistSkeleton,
  SmartDate,
  SVGWrapper,
  TransText,
} from "@repo/shared-ui";
import { useTrendingData } from "./hooks/usePostTrends";
import { Box, Stack } from "@mui/material";
import { applyBGPattern, summarizeNum } from "@repo/helpers";
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
        padding: theme.boxSpacing(18, 16, 16, 16),
        [theme.breakpoints.down("sm")]: {
          gap: theme.gap(14),
          padding: theme.boxSpacing(16, 14, 14, 14),
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
      <TransText
        component="h5"
        trimCount={6}
        sx={{
          ...theme.typography.subtitle1,
          zIndex: 2,
          position: "relative",
          color: "#FFFFFF",
          textShadow: hasMedia ? "0px 2px 8px rgba(0,0,0,0.2)" : "none",
        }}>
        {data.caption}
      </TransText>

      {/* Engagement Footer Details */}
      <Box
        sx={{
          zIndex: 2,
          color: "#FFFFFF",
          width: "100%",
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: theme.gap(6),
        }}>
        <SVGWrapper
          src={data.avatar}
          size={42}
          preserveColor={true}
          sx={{
            flex: "none",
            border: "2px solid #FFFFFF",
            borderRadius: theme.radius.full,
            overflow: "hidden",
          }}
        />
        <Box
          sx={{
            width: "100%",
          }}>
          {data.post.postType === "GIST" ? (
            <>
              <TransText
                {...(data.post.likeCount === 1
                  ? POST_INFO.post_likes_one(summarizeNum(data.post.likeCount))
                  : POST_INFO.post_likes_many(
                      summarizeNum(data.post.likeCount),
                    ))}
                sx={{
                  ...theme.typography.body1,
                  color: "inherit",
                }}
              />
              <Box
                sx={{
                  display: "inline-flex",
                  flexDirection: "row",
                  gap: theme.gap(2),
                }}>
                <SmartDate
                  timestamp={data.post.createdAt}
                  adaptiveTime={useAdaptiveTime}
                  suffix="ago |"
                  sx={{
                    ...theme.typography.body3,
                    color: "inherit",
                  }}
                />
                <TransText
                  {...(data.post.viewCount === 1
                    ? POST_INFO.post_views_one(
                        summarizeNum(data.post.viewCount),
                      )
                    : POST_INFO.post_views_many(
                        summarizeNum(data.post.viewCount),
                      ))}
                  trimCount={1}
                  sx={{
                    ...theme.typography.body3,
                    color: "inherit",
                    width: "100%",
                  }}
                />
              </Box>
            </>
          ) : (
            <TransText
              sx={{
                ...theme.typography.body3,
                color: "inherit",
                display: "block",
              }}>
              Shared trending post
            </TransText>
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
        <GistSkeleton
          quantity={1}
          bgColor={theme.palette.gray.trans.overlay(0.08)}
        />
      ) : carouselItems.length > 0 ? (
        <>
          <TransText
            {...COMMON_FEEDBACK.trends_missed}
            component="h5"
            sx={{
              ...theme.typography.h6,
              width: "100%",
              color: theme.palette.primary.light,
              textAlign: "center",
            }}
          />
          <LinearCarousel
            items={carouselItems}
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
            <TransText
              {...COMMON_FEEDBACK.quote1}
              component="h6"
              sx={{
                ...theme.typography.h6,
                textAlign: "center",
                width: "80%",
                color: theme.palette.gray[0],
              }}
            />
            <TransText
              sx={{
                ...theme.typography.body1,
                fontWeight: "600",
                width: "100%",
                textAlign: "center",
                color: theme.palette.primary.light,
              }}>
              ~ Funstakes
            </TransText>
          </Stack>
        </>
      )}
    </Box>
  );
};

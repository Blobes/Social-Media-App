"use client";

import React from "react";
import { Skeleton, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";

type Variant = "text" | "rectangular" | "rounded" | "circular";

interface PostSkeletonProps {
  quantity?: number;
  bgColor?: string;
  avatar?: {
    variant?: Variant;
    width?: string | number;
    height?: string | number;
  };
  authorInfo?: {
    variant?: Variant;
    width?: string | number;
    height?: string | number;
  };
  body?: {
    variant?: Variant;
    width?: string | number;
    height?: string | number;
  };
}
interface BoxSkeletonProps {
  variant?: Variant;
  quantity?: number;
  bgColor?: string;
  width?: string | number;
  height?: string | number;
  radius?: string | number;
}
export const PostSkeleton = ({
  quantity = 2,
  bgColor,
  avatar,
  authorInfo,
  body,
}: PostSkeletonProps) => {
  const theme = useTheme();

  const avatarStyle = {
    flex: "none",
    bgcolor: bgColor || theme.palette.gray.trans[1],
    width: avatar?.width || 36,
    height: avatar?.height || 36,
  };
  const authorInfoStyle = {
    bgcolor: bgColor || theme.palette.gray.trans[1],
    width: authorInfo?.width || "100%",
    height: authorInfo?.height || 14,
    radius: 0,
  };
  const bodyStyle = {
    bgcolor: bgColor || theme.palette.gray.trans[1],
    width: body?.width || "100%",
    height: body?.height || 300,
    radius: 0,
  };

  return (
    <Stack sx={{ width: "100%", gap: theme.gap(8) }}>
      {Array.from({ length: quantity }).map((_, index) => (
        <Stack key={index} sx={{ width: "inherit", gap: theme.gap(4) }}>
          {/* Post Header*/}
          <Stack
            sx={{
              width: "inherit",
              alignItems: "center",
              flexDirection: "row",
              [theme.breakpoints.down("md")]: {
                paddingX: theme.boxSpacing(6),
              },
            }}>
            {/* Avatar */}
            <Skeleton
              variant={avatar?.variant || "circular"}
              sx={{ ...avatarStyle }}
            />
            {/* Author info */}
            <Stack sx={{ width: "inherit", gap: theme.gap(3) }}>
              <Skeleton
                variant={authorInfo?.variant || "rectangular"}
                sx={{ ...authorInfoStyle }}
              />
              <Skeleton
                variant={authorInfo?.variant || "rectangular"}
                sx={{ ...authorInfoStyle }}
              />
            </Stack>
          </Stack>
          {/* Post Body */}
          <Skeleton
            variant={body?.variant || "rectangular"}
            sx={{ ...bodyStyle }}
          />
        </Stack>
      ))}
    </Stack>
  );
};

export const BoxSkeleton = ({
  variant = "rectangular",
  quantity = 2,
  bgColor,
  width,
  height,
  radius,
}: BoxSkeletonProps) => {
  const theme = useTheme();
  const style = {
    bgcolor: bgColor || theme.palette.gray.trans[1],
    width: width || "100%",
    height: height || 300,
    radius: radius || 0,
  };
  return (
    <Stack sx={{ width: "100%", gap: theme.gap(8) }}>
      {Array.from({ length: quantity }).map((_, index) => (
        <Skeleton key={index} variant={variant} sx={{ ...style }} />
      ))}
    </Stack>
  );
};

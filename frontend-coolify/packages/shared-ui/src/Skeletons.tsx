"use client";

import React from "react";
import { Skeleton, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";

interface SkeletonProps {
  quantity?: number;
  bgColor?: string;
}
export const GistSkeleton = ({ quantity = 2, bgColor }: SkeletonProps) => {
  const theme = useTheme();
  const defaultStyle = {
    bgcolor: bgColor || theme.palette.gray.trans[1],
    width: "100%",
    height: 14,
    radius: 0,
  };

  return (
    <Stack sx={{ width: "100%", gap: theme.gap(8) }}>
      {Array.from({ length: quantity }).map((_, index) => (
        <Stack key={index} sx={{ width: "inherit", gap: theme.gap(4) }}>
          {/* Gist Header*/}
          <Stack
            sx={{
              width: "inherit",
              alignItems: "center",
              flexDirection: "row",
              [theme.breakpoints.down("md")]: {
                paddingX: theme.boxSpacing(6),
              },
            }}>
            <Skeleton
              variant="circular"
              sx={{
                flex: "none",
                ...defaultStyle,
                height: 36,
                width: 36,
              }}
            />
            <Stack sx={{ width: "inherit", gap: theme.gap(3) }}>
              <Skeleton variant="rectangular" sx={{ ...defaultStyle }} />
              <Skeleton variant="rectangular" sx={{ ...defaultStyle }} />
            </Stack>
          </Stack>
          <Skeleton
            variant="rectangular"
            sx={{ ...defaultStyle, height: 300 }}
          />
        </Stack>
      ))}
    </Stack>
  );
};

export const StakeSkeleton = ({ quantity = 2, bgColor }: SkeletonProps) => {
  const theme = useTheme();
  const defaultStyle = {
    bgcolor: bgColor || theme.palette.gray.trans[1],
    width: "100%",
    height: 40,
    radius: 0,
  };
  return (
    <Stack sx={{ width: "100%", gap: theme.gap(8) }}>
      {Array.from({ length: quantity }).map((_, index) => (
        <Skeleton
          key={index}
          variant="rectangular"
          sx={{ ...defaultStyle, height: 300 }}
        />
      ))}
    </Stack>
  );
};

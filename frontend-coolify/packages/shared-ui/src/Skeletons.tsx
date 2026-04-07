"use client";

import React from "react";
import { Skeleton, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";

interface Style {
  bgColor?: string;
  width?: string | number;
  height?: string | number;
  radius?: string | number;
}
interface SkeletonProps {
  quantity?: number;
}

const defaultStyle = (theme: any, styles?: Style) => ({
  bgcolor: styles?.bgColor || theme.palette.gray.trans[1],
  width: styles?.width || "100%",
  height: styles?.height || 16,
  radius: styles?.radius,
});

export const GistSkeleton = ({ quantity = 2 }: SkeletonProps) => {
  const theme = useTheme();
  return (
    <Stack sx={{ width: "100%", gap: theme.gap(8) }}>
      {Array.from({ length: quantity }).map((_, index) => (
        <Stack key={index} sx={{ width: "inherit", gap: theme.gap(4) }}>
          {/* Gist Header*/}
          <Stack
            sx={{
              width: "inherit",
              flexDirection: "row",
              [theme.breakpoints.down("md")]: {
                paddingX: theme.boxSpacing(6),
              },
            }}>
            <Skeleton
              variant="circular"
              sx={{
                flex: "none",
                ...defaultStyle(theme, { width: 40, height: 40 }),
              }}
            />
            <Stack sx={{ width: "inherit" }}>
              <Skeleton variant="rectangular" sx={defaultStyle(theme)} />
              <Skeleton variant="rectangular" sx={defaultStyle(theme)} />
            </Stack>
          </Stack>
          <Skeleton
            variant="rectangular"
            sx={defaultStyle(theme, { height: 300 })}
          />
        </Stack>
      ))}
    </Stack>
  );
};

export const StakeSkeleton = ({ quantity = 2 }: SkeletonProps) => {
  const theme = useTheme();
  return (
    <Stack sx={{ width: "100%", gap: theme.gap(8) }}>
      {Array.from({ length: quantity }).map((_, index) => (
        <Skeleton
          key={index}
          variant="rectangular"
          sx={defaultStyle(theme, { height: 300 })}
        />
      ))}
    </Stack>
  );
};

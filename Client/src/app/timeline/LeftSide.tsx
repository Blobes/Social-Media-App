"use client";

import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ProfileCard } from "@/shared/components/Cards";
import { FollowersCard } from "@/shared/components/Cards";

export default function LeftSide() {
  const theme = useTheme();
  return (
    <Stack
      sx={{
        gap: theme.gap(8),
        padding: theme.boxSpacing(8, 16),
      }}>
      <ProfileCard />
      <Typography variant="subtitle1">Those following you</Typography>
      <FollowersCard />
    </Stack>
  );
}

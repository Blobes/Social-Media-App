"use client";

import { Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ProfileCard } from "./Cards";
import { Followers } from "./Followers";
import { ScrollableContainer } from "@/components/Containers";

export default function LeftSide() {
  const theme = useTheme();
  return (
    <ScrollableContainer
      sx={{
        width: "28%",
        minWidth: "300px",
        maxWidth: "500px",
        [theme.breakpoints.down("md")]: { display: "none" },
        gap: theme.gap(8),
        padding: theme.boxSpacing(8, 16),
      }}>
      <ProfileCard />
      <Typography variant="subtitle1" sx={{ width: "100%" }}>
        Those following you
      </Typography>
      <Followers />
    </ScrollableContainer>
  );
}

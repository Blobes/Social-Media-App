"use client";

import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ProfileCard } from "./ProfileCard";
import { Followers } from "./Followers";
import { useStyles } from "@/hooks/style";

export const RightSidebar = () => {
  const theme = useTheme();
  const { autoScroll } = useStyles();

  return (
    <Stack
      sx={{
        width: "34%",
        minWidth: "300px",
        maxWidth: "500px",
        gap: theme.gap(8),
        flex: "none",
        padding: theme.boxSpacing(8, 20),
        ...autoScroll().base,
        [theme.breakpoints.down("md")]: {
          display: "none",
          ...autoScroll().mobile,
        },
      }}>
      <ProfileCard />
      <Typography variant="subtitle1" sx={{ width: "100%" }}>
        Those following you
      </Typography>
      <Followers />
    </Stack>
  );
};

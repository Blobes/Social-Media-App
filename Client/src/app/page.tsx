"use client";

import { Box, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import LeftSide from "./timeline/LeftSide";
import { Posts } from "./timeline/Posts";
import { useAppContext } from "./AppContext";
import { Login } from "./auth/login/Login";
import { useStyles } from "@/shared/helpers/styles";
import { ScrollableContainer } from "@/shared/components/Containers";

export default function HomePage() {
  const theme = useTheme();
  const { scrollBarStyle } = useStyles();
  const { isLoggedIn } = useAppContext();
  return isLoggedIn ? (
    <Stack
      sx={{
        height: "100%",
        gap: theme.gap(0),
        backgroundColor: theme.palette.gray[0],
        padding: {
          sm: theme.boxSpacing(0),
          md: theme.boxSpacing(0, 32),
        },
        overflowY: "hidden",
        overflowX: "auto",
        flexDirection: "row",
        justifyContent: "center",
        [theme.breakpoints.down("md")]: {
          overflowY: "auto",
          justifyContent: "flex-start",
          alignItems: "center",
          flexDirection: "column",
        },
        ...scrollBarStyle(),
      }}>
      <LeftSide />
      <Posts />
      <ScrollableContainer
        sx={{
          width: "28%",
          maxWidth: "500px",
          minWidth: "300px",
          [theme.breakpoints.down("md")]: { display: "none" },
        }}>
        Col 3
      </ScrollableContainer>
    </Stack>
  ) : (
    <Stack
      sx={{
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.gap(12),
      }}>
      <Typography component="h4" variant="h6">
        You are logged currently out!
      </Typography>
      <Login />
    </Stack>
  );
}

"use client";

import { Box, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import LeftSide from "./timeline/LeftSide";
import { Posts } from "./timeline/Posts";
import { useAppContext } from "./AppContext";
import { Login } from "./auth/login/Login";
import { styled } from "@mui/material/styles";
import { useStyles } from "@/shared/helpers/styles";

const Container = styled(Box)(({ theme }) =>
  theme.unstable_sx({
    overflowY: "auto",
    height: "100%",
    [theme.breakpoints.down("md")]: {
      height: "fit-content",
      width: "100%",
      overflowY: "unset",
      minWidth: "200px",
    },
    "&::-webkit-scrollbar": {
      width: "0px",
    },
  })
);

export default function HomePage() {
  const theme = useTheme();
  const { scrollBarStyle } = useStyles();
  const { isLoggedIn } = useAppContext();
  return isLoggedIn ? (
    <Stack
      sx={{
        height: "100%",
        gap: theme.gap(0),
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
      <Container
        sx={{
          width: "28%",
          minWidth: "300px",
          maxWidth: "500px",
          [theme.breakpoints.down("md")]: { display: "none" },
        }}>
        <LeftSide />
      </Container>
      <Container
        sx={{
          borderLeft: `1px solid ${theme.palette.gray.trans[2]}`,
          borderRight: `1px solid ${theme.palette.gray.trans[2]}`,
          width: "44%",
          maxWidth: "650px",
          minWidth: "400px",
        }}>
        <Posts />
      </Container>
      <Container
        sx={{
          width: "28%",
          maxWidth: "500px",
          minWidth: "300px",
          [theme.breakpoints.down("md")]: { display: "none" },
        }}>
        Col 3
      </Container>
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

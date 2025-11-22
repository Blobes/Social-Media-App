"use client";

import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import LeftSide from "./timeline/LeftSide";
import { Posts } from "./timeline/Posts";
import { useStyles } from "@/helpers/styles";
import { ScrollableContainer } from "@/components/Containers";

export default function HomePage() {
  const theme = useTheme();
  const { scrollBarStyle } = useStyles();

  return (
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
  );
}

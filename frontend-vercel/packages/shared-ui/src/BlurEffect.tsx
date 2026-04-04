"use client";

import { Box } from "@mui/material";
import { useTheme, styled } from "@mui/material/styles";
import { blue } from "@mui/material/colors";

const Blur = styled("div")(({ theme }) =>
  theme.unstable_sx({
    position: "fixed",
    borderRadius: theme.radius.full,
    width: "500px",
    height: "350px",
    zIndex: -1,
    filter: "blur(72px)",
    opacity: 0.04,
  })
);

export const BlurEffect = () => {
  const theme = useTheme();
  return (
    <Box>
      <Blur
        sx={{
          backgroundColor: theme.palette.primary.main,
          top: "10px",
          left: "-60px",
        }}></Blur>
      <Blur
        sx={{
          backgroundColor: blue.A700,
          top: "20px",
          right: "-30px",
        }}></Blur>
      <Blur
        sx={{
          backgroundColor: theme.palette.primary.main,
          bottom: "20px",
          right: "-30px",
        }}></Blur>
    </Box>
  );
};

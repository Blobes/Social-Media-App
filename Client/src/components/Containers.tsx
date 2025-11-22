import { styled } from "@mui/material/styles";
import { Box, Stack } from "@mui/material";

export const ScrollableContainer = styled(Stack)(({ theme }) =>
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

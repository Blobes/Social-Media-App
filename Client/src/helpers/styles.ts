"use client";

import { useTheme } from "@mui/material/styles";

export const useStyles = () => {
  const theme = useTheme();

  const scrollBarStyle = () => {
    return {
      "&::-webkit-scrollbar": {
        height: "6px",
        width: "6px",
      },
      "&::-webkit-scrollbar-track": {
        borderRadius: theme.radius[2],
        margin: "0px 8px",
      },
      "&::-webkit-scrollbar-thumb": {
        background: theme.palette.gray[100] /* Scrollbar color */,
        borderRadius: theme.radius[2],
        boxShadow: "inset 0 0 4px 4px rgba(0, 0, 0, 0.1)",
      },
      "&::-webkit-scrollbar-thumb:hover": {
        background: theme.palette.gray.trans[2] /* Color on hover */,
      },
    };
  };
  return { scrollBarStyle };
};

"use client";

import React from "react";
import { styled, useTheme } from "@mui/material/styles";
import { InputBase, Stack, Typography } from "@mui/material";
import { Search as SearchIcon } from "lucide-react";

const InputWrapper = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  alignItems: "center",
  padding: theme.boxSpacing(4, 5),
  height: 40,
  transition: `width 0.3s ease-in-out, border 0.2s ease-in`,
  width: "28%",
  [theme.breakpoints.down("sm")]: {
    width: "100%",
  },
  "&:focus-within": {
    width: "32%",
  },
  // Border
  borderRadius: `${theme.radius.full}`,
  border: `1.5px solid transparent`,
  background: `linear-gradient(${theme.palette.gray[0]}) padding-box, 
  linear-gradient(to right, #7928ca, #0070f3, #00dfd8) border-box`,
  "&:hover": {
    border: `1.5px solid ${theme.palette.primary.dark}`,
  },
}));

export const SearchBar = () => {
  return (
    <InputWrapper>
      <SearchIcon size="20" />
      <InputBase
        placeholder="Explore"
        inputProps={{ "aria-label": "search" }}
        sx={{
          width: "100%",
          fontSize: "15px!important",
          fontWeight: "500",
        }}
      />
    </InputWrapper>
  );
};

export const SearchContainer = () => {
  const theme = useTheme();
  return (
    <InputWrapper sx={{ cursor: "pointer" }}>
      <SearchIcon size="20" />
      <Typography
        component="p"
        variant="body3"
        sx={{
          color: theme.palette.gray[200],
          width: "100%",
          fontWeight: "500",
        }}>
        Search & explore
      </Typography>
    </InputWrapper>
  );
};

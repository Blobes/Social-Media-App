"use client";

import React from "react";
import { styled } from "@mui/material/styles";
import { InputBase } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { SearchOutlined, SearchTwoTone } from "@mui/icons-material";

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: `${theme.radius.full}`,
  backgroundColor: `${theme.palette.gray.trans[1]}`,
  "&:hover": {
    backgroundColor: `${theme.palette.gray.trans[1]}`,
  },
  marginLeft: theme.boxSpacing(0),
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    marginLeft: theme.boxSpacing(1),
    width: "auto",
  },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.boxSpacing(5),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  width: "100%",
  height: "40px",
  fontSize: "16px!important",
  "& .MuiInputBase-input": {
    padding: theme.boxSpacing(5, 5, 5, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.boxSpacing(12)})`,
    transition: theme.transitions.create("width"),
    [theme.breakpoints.up("sm")]: {
      width: "25ch",
      "&:focus": {
        width: "30ch",
      },
    },
  },
}));

export const SearchBar = () => {
  return (
    <Search>
      <SearchIconWrapper>
        <SearchOutlined />
      </SearchIconWrapper>
      <StyledInputBase
        placeholder="Explore something"
        id=""
        inputProps={{ "aria-label": "search" }}
      />
    </Search>
  );
};

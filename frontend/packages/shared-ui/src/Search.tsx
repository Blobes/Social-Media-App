"use client";

import { styled, useTheme } from "@mui/material/styles";
import { InputBase, Stack, Typography } from "@mui/material";
import { Search as SearchIcon } from "lucide-react";

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

interface SearchProps {
  animateBorder: (args: any) => any
}

export const SearchBar = () => {
  return (
    <Search>
      <SearchIconWrapper>
        <SearchIcon />
      </SearchIconWrapper>
      <StyledInputBase
        placeholder="Explore something"
        id=""
        inputProps={{ "aria-label": "search" }}
      />
    </Search>
  );
};

export const SearchContainer = ({ animateBorder }: SearchProps) => {
  const theme = useTheme();
  return (
    <Stack flexDirection="row" sx={{
      padding: theme.boxSpacing(4, 5),
      borderRadius: theme.radius.full,
      border: `1px solid ${theme.fixedColors.mainTrans}`,
      backgroundColor: theme.palette.gray[50],
      width: "30%",
      alignItems: "center",
      zIndex: 5,
      transition: "all 0.2s ease-in",
      cursor: "text",
      // Apply border animation
      ...animateBorder({
        borderColor: theme.palette.primary.main,
      }),
      "&:hover": {
        backgroundColor: theme.palette.gray[0],
        border: `1px solid ${theme.palette.primary.main}`,
      },
    }}>
      <SearchIcon size="18" stroke={theme.palette.primary.dark} />
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
    </Stack>
  );
};


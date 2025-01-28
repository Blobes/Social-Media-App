"use client";

import React from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ListItemType } from "../types";

interface MenuProps {
  hide?: { xs?: Boolean; md?: Boolean };
  triggerElement: React.ReactNode;
  closeElement?: React.ReactNode;
  listItems: ListItemType[];
}
export const MenuPopup = ({
  listItems,
  triggerElement,
  closeElement,
  hide = { xs: false, md: false },
}: MenuProps) => {
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(
    null
  );
  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const theme = useTheme();
  return (
    <Box
      sx={{
        display: {
          xs: hide.xs ? "none" : "flex",
          md: hide.md ? "none" : "flex",
        },
        alignItems: "center",
      }}>
      {/* Menu trigger element */}
      <Box
        aria-label="account of current user"
        aria-controls="menu-appbar"
        aria-haspopup="true"
        onClick={handleOpenNavMenu}
        color="inherit"
        sx={{
          backgroundColor: anchorElNav && theme.palette.gray.trans[1],
          borderRadius: theme.radius.full,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "30px",
          height: "30px",
        }}>
        {anchorElNav && closeElement ? closeElement : triggerElement}
      </Box>

      {/* Menu list container */}
      <Menu
        anchorEl={anchorElNav}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        keepMounted
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        open={Boolean(anchorElNav)}
        onClose={handleCloseNavMenu}
        sx={{
          display: {
            xs: hide.xs ? "none" : "block",
            md: hide.md ? "none" : "block",
          },
        }}>
        {/* Menu list items */}
        {listItems.map((listItem, index) => {
          return (
            <MenuItem
              sx={{ padding: theme.boxSpacing(0) }}
              key={index}
              onClick={() => {
                handleCloseNavMenu();
                listItem.action && listItem.action();
              }}>
              {listItem.item}
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
};

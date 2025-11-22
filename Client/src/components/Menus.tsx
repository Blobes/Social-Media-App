"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  ReactNode,
} from "react";
import { Menu, paperClasses } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export interface MenuRef {
  openMenu: (anchor: HTMLElement) => void;
  closeMenu: () => void;
}
interface MenuProps {
  contentElement: ReactNode;
}

export const MenuPopup = forwardRef<MenuRef, MenuProps>(
  ({ contentElement }, ref) => {
    const theme = useTheme();
    const [anchorElNav, setAnchorEl] = useState<null | HTMLElement>(null);
    useImperativeHandle(ref, () => ({
      openMenu: (anchor: HTMLElement) => {
        setAnchorEl(anchor);
      },
      closeMenu: () => {
        setAnchorEl(null);
      },
    }));
    return (
      <Menu
        anchorEl={anchorElNav}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        open={Boolean(anchorElNav)}
        onClose={() => setAnchorEl(null)}
        keepMounted
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        MenuListProps={{ disablePadding: true }}
        sx={{
          alignItems: "center",
          zIndex: 1000,
          padding: theme.boxSpacing(2, 0),
          [`& .${paperClasses.root}`]: {
            borderRadius: theme.radius[2],
            paddingY: theme.boxSpacing(3),
            border: `1px solid ${theme.palette.gray[50]}`,
            minWidth: 220,
          },
        }}>
        {contentElement}
      </Menu>
    );
  }
);

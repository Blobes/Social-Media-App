"use client";

import { forwardRef, useImperativeHandle, useState, ReactNode } from "react";
import { Menu, paperClasses } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { MenuRef } from "@repo/types";

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
        slotProps={{ list: { disablePadding: true } }}
        sx={{
          alignItems: "center",
          zIndex: 1000,
          padding: theme.boxSpacing(2, 0),

          [`& .${paperClasses.root}`]: {
            borderRadius: theme.radius[2],
            padding: theme.boxSpacing(4),
            border: `1px solid ${theme.palette.gray[50]}`,
            width: "fit-content",
            minWidth: 200,
            maxWidth: 250,
            "& ul": {
              display: "flex",
              flexDirection: "column",
            }
          },
        }}>
        {contentElement}
      </Menu>
    );
  }
);

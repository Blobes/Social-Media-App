"use client";
import React from "react";
import { Stack, svgIconClasses, typographyClasses } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { MenuPopup, MenuRef } from "../Menus";
import { NavBarProps } from "@/types";
import { useContent } from "./Contents";
import { useAppContext } from "@/app/AppContext";

interface DestopNavProps extends NavBarProps {
  menuRef?: React.RefObject<MenuRef>;
  closePopup?: () => void;
}

export const DesktopNav: React.FC<DestopNavProps> = ({
  currentPage,
  setCurrentPage,
  defaultNavList,
  loggedInNavList,
  menuRef = null,
  closePopup,
}) => {
  const theme = useTheme();
  const { RenderList } = useContent();
  const { loginStatus } = useAppContext();
  const isLoggedIn = loginStatus === "AUTHENTICATED";

  return (
    <Stack
      sx={{
        display: {
          xs: "none",
          md: "flex",
        },
        flexDirection: "row",
        gap: theme.gap(4),
      }}>
      <RenderList
        list={defaultNavList}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        closePopup={closePopup}
        style={{
          padding: theme.boxSpacing(1, 5, 1, 4),
          [`& .${svgIconClasses.root}`]: {
            fill: theme.palette.gray[200],
            width: "20px",
            height: "20px",
          },
          [`& .${typographyClasses.root}`]: {
            padding: theme.boxSpacing(1, 0, 0, 0),
          },
        }}
      />
      {isLoggedIn && (
        <MenuPopup
          ref={menuRef}
          contentElement={
            <RenderList
              list={loggedInNavList}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              closePopup={closePopup}
              style={{
                padding: theme.boxSpacing(4, 8),
                borderRadius: "unset",
                gap: theme.gap(8),
                [`& .${svgIconClasses.root}`]: {
                  fill: theme.palette.gray[200],
                  width: "20px",
                  height: "20px",
                },
              }}
            />
          }
        />
      )}
    </Stack>
  );
};

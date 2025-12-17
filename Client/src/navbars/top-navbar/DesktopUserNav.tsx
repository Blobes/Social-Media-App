"use client";
import React, { useRef } from "react";
import { Stack, svgIconClasses, typographyClasses } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { NavBarProps } from "@/types";
import { useAppContext } from "@/app/AppContext";
import { RenderList } from "../RenderNavLists";
import { MenuPopup, MenuRef } from "@/components/Menus";
import { useNavLists } from "../NavLists";
import { useSharedHooks } from "@/hooks";

interface DestopNavProps extends NavBarProps {
  menuRef?: React.RefObject<MenuRef>;
  closePopup?: () => void;
}

export const DesktopUserNav = () => {
  const theme = useTheme();
  const { userNavList } = useNavLists();
  const { setLastPage } = useSharedHooks();
  const { setModalContent } = useAppContext();
  const menuRef = useRef<MenuRef>(null);

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
      <MenuPopup
        ref={menuRef}
        contentElement={
          <RenderList
            list={userNavList}
            setLastPage={setLastPage}
            closePopup={() => {
              menuRef.current?.closeMenu();
              setModalContent(null);
            }}
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
    </Stack>
  );
};

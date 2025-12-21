"use client";
import React, { useRef } from "react";
import {
  Stack,
  svgIconClasses,
  typographyClasses,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAppContext } from "@/app/AppContext";
import { RenderList } from "../RenderNavLists";
import { MenuRef } from "@/components/Menus";
import { useNavLists } from "../NavLists";
import { useSharedHooks } from "@/hooks";

interface WebNavProps {
  style?: any;
}
export const WebNav: React.FC<WebNavProps> = ({ style }) => {
  const theme = useTheme();
  const { webNavList } = useNavLists();
  const menuRef = useRef<MenuRef>(null);
  const { setLastPage, closeModal } = useSharedHooks();

  return (
    <Stack sx={{ ...style }}>
      <RenderList
        list={webNavList}
        setLastPage={setLastPage}
        closePopup={() => {
          menuRef.current?.closeMenu();
          closeModal();
        }}
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
    </Stack>
  );
};

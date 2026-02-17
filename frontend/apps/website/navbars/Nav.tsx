"use client";
import React, { useRef } from "react";
import { Divider, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { RenderItemList, MenuRef, AppButton } from "@shared-ui";
import { useMisc, useNavLists, usePage } from "@hooks";
import { useGlobalContext } from "@shared-state";
import { clientRoutes } from "@helpers";


interface NavProps {
  style?: any;
}
export const DesktopNav: React.FC<NavProps> = ({ style }) => {
  const theme = useTheme();
  const { headerNavList } = useNavLists();
  const menuRef = useRef<MenuRef>(null);


  return (
    <Stack sx={{ ...style }}>
      <RenderItemList
        list={headerNavList}
        style={{
          padding: theme.boxSpacing(2.5, 6, 2.5, 6),
          fontWeight: "500",
          "& svg": {
            width: "16px",
            height: "16px",
          },
        }}
      />
    </Stack>
  );
};

export const MobileNav: React.FC<NavProps> = ({ style }) => {
  const theme = useTheme();
  const { headerNavList } = useNavLists();
  const menuRef = useRef<MenuRef>(null);
  const { navigateTo } = usePage();
  const { authStatus } = useGlobalContext();
  const { closeDrawer } = useMisc();

  return (
    <Stack sx={{ ...style }}>
      <RenderItemList
        list={headerNavList}
        itemAction={() => {
          menuRef.current?.closeMenu();
          closeDrawer()
        }}
        style={{
          padding: theme.boxSpacing(4, 6),
          textAlign: "left",
          gap: theme.boxSpacing(6),
          width: "100%",
          "& svg": {
            width: "20px",
            height: "20px",
          },
        }}
      />
      <Divider />
      {authStatus === "AUTHENTICATED" && (
        <AppButton
          href={clientRoutes.home.path}
          variant="outlined"
          style={{ fontSize: "14px" }}
          onClick={() =>
            navigateTo(clientRoutes.home, { type: "element", loadPage: true, })
          }>
          Go to funstakes.com
        </AppButton>
      )}

      {authStatus === "UNAUTHENTICATED" && (
        <>
          <AppButton
            href={clientRoutes.signup.path}
            style={{ fontSize: "14px" }}
            onClick={() =>
              navigateTo(clientRoutes.signup,
                { type: "element", savePage: false, loadPage: true, })
            }>
            Sign up
          </AppButton>
          <AppButton
            href={clientRoutes.login.path}
            variant="outlined"
            style={{ fontSize: "14px" }}
            onClick={() =>
              navigateTo(clientRoutes.login,
                { type: "element", savePage: false, loadPage: true, })
            }>
            Login
          </AppButton>
        </>
      )}
    </Stack>
  );
};

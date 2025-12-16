"use client";

import React, { useRef } from "react";
import {
  AppBar,
  Toolbar,
  Stack,
  useMediaQuery,
  IconButton,
  Link,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAppContext } from "@/app/AppContext";
import { DesktopNav } from "./DesktopNav";
import { MobileNav } from "./MobileNav";
import { SearchBar } from "../Search";
import { ModalRef } from "../Modal";
import { MenuRef } from "../Menus";
import { UserAvatar } from "@/components/UserAvatar";
import { useContent } from "./Contents";
import { Menu } from "@mui/icons-material";
import { AppButton } from "../Buttons";
import { useSharedHooks } from "../../hooks";
import { ThemeSwitcher } from "../ThemeSwitcher";
import { defaultPage } from "@/helpers/info";
import { useRouter } from "next/navigation";

// Header component: Renders the top navigation bar, adapting to screen size and login state
export const Header: React.FC = () => {
  // Global app context
  const { loginStatus, authUser, lastPage } = useAppContext();
  const { firstName, lastName, profileImage } = authUser || {};
  // Shared hooks
  const { setLastPage } = useSharedHooks();

  // Theme and responsive breakpoint
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const router = useRouter();

  // Refs for controlling drawers and menus
  const drawerRef = useRef<ModalRef>(null);
  const menuRef = useRef<MenuRef>(null);

  // Navigation items for logged-in and default views
  const { defaultNavList, loggedInNavList } = useContent();

  // Check if user is logged in
  const isLoggedIn = loginStatus === "AUTHENTICATED";

  return (
    <AppBar
      position="sticky"
      sx={{ zIndex: 500 }}
      component={"nav"}
      aria-label="Main navigation"
      role="navigation">
      <Toolbar
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${theme.palette.gray.trans[1]}`,
          padding: theme.boxSpacing(6, 10),
          gap: theme.gap(6),
        }}>
        {/* Brand Logo */}
        <Link
          href={defaultPage.path}
          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            router.push(defaultPage.path);
            setLastPage(defaultPage);
          }}>
          <img
            alt="logo"
            src="/assets/images/logo.png"
            style={{ borderRadius: `${theme.radius[2]}`, width: "40px" }}
          />
        </Link>

        {/* Search bar centered in header */}
        <SearchBar />

        {/* Right-side navigation stack */}
        <Stack direction="row" alignItems="center" spacing={theme.gap(8)}>
          {/* Navigation changes based on screen size */}
          {isDesktop ? (
            <DesktopNav
              lastPage={lastPage}
              setLastPage={setLastPage}
              defaultNavList={defaultNavList}
              loggedInNavList={loggedInNavList}
              menuRef={menuRef}
              closePopup={() => {
                drawerRef.current?.closeModal();
                menuRef.current?.closeMenu();
              }}
            />
          ) : (
            <MobileNav
              lastPage={lastPage}
              setLastPage={setLastPage}
              defaultNavList={defaultNavList}
              loggedInNavList={loggedInNavList}
              drawerRef={drawerRef}
              closePopup={() => {
                drawerRef.current?.closeModal();
                menuRef.current?.closeMenu();
              }}
            />
          )}

          {/* Right-side user controls */}
          <ThemeSwitcher />
          {isLoggedIn ? (
            // Show avatar if user is authenticated
            <UserAvatar
              userInfo={{ firstName, lastName, profileImage }}
              toolTipValue="Open menu"
              action={(e) =>
                isDesktop
                  ? menuRef.current?.openMenu(e.currentTarget)
                  : drawerRef.current?.openModal()
              }
              style={{
                width: "30px",
                height: "30px",
              }}
            />
          ) : (
            // If not logged in, show login button and menu icon on mobile
            <React.Fragment>
              <AppButton style={{ fontSize: "14px" }} href="/auth/login">
                Login
              </AppButton>

              {/* Only show hamburger menu if not desktop */}
              {!isDesktop && (
                <IconButton onClick={() => drawerRef.current?.openModal()}>
                  <Menu />
                </IconButton>
              )}
            </React.Fragment>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

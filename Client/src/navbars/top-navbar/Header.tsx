"use client";

import React, { useEffect, useRef, MouseEvent } from "react";
import {
  AppBar,
  Toolbar,
  Stack,
  IconButton,
  Link,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Menu } from "@mui/icons-material";
import { usePathname, useRouter } from "next/navigation";

import { useAppContext } from "@/app/AppContext";
import { useSharedHooks } from "../../hooks";

import { WebNav } from "./WebNav";
import { DesktopUserNav } from "./DesktopUserNav";
import { MobileUserNav } from "./MobileUserNav";

import { SearchBar } from "../../components/Search";
import { UserAvatar } from "@/components/UserAvatar";
import { ThemeSwitcher } from "../../components/ThemeSwitcher";
import { AppButton } from "../../components/Buttons";
import { MenuRef } from "@/components/Menus";

import { defaultPage, flaggedRoutes, routes } from "@/helpers/info";

export const Header: React.FC = () => {
  const { loginStatus, authUser, modalContent, setModalContent } =
    useAppContext();
  const { setLastPage } = useSharedHooks();

  const theme = useTheme();
  const router = useRouter();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isLoggedIn = loginStatus === "AUTHENTICATED";

  const menuRef = useRef<MenuRef>(null);

  const { firstName, lastName, profileImage } = authUser || {};

  const pathname = usePathname();
  const isWeb = flaggedRoutes.web.includes(pathname);

  /* ---------------------------------- effects --------------------------------- */
  useEffect(() => {
    const handleResize = () => {
      if (isDesktop && modalContent?.source === "navbar") {
        setModalContent(null);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isDesktop, modalContent, setModalContent]);

  /* -------------------------------- handlers --------------------------------- */
  const handleLogoClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    router.push(defaultPage.path);
    setLastPage(defaultPage);
  };

  const openMobileWebNav = () =>
    setModalContent({
      content: (
        <WebNav
          style={{
            display: { xs: "flex", md: "none" },
            // flexDirection: "column",
            gap: theme.gap(4),
          }}
        />
      ),
      source: "navbar",
      entryDir: "LEFT",
      style: {
        // overlay: {
        //   display: { xs: "flex", md: "none" },
        // },
        content: { otherStyles: { height: "100%" } },
      },
    });

  const openMobileUserNav = () =>
    setModalContent({
      content: <MobileUserNav />,
      source: "navbar",
      entryDir: "RIGHT",
      style: {
        // overlay: {
        //   display: { xs: "flex", md: "none" },
        // },
        content: { otherStyles: { height: "100%" } },
      },
    });

  /* ---------------------------------- render ---------------------------------- */
  return (
    <AppBar
      position="sticky"
      component="nav"
      aria-label="Main navigation"
      role="navigation"
      sx={{ zIndex: 500 }}>
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: theme.gap(6),
          padding: theme.boxSpacing(6, 10),
          borderBottom: `1px solid ${theme.palette.gray.trans[1]}`,
        }}>
        {/* Mobile hamburger (logged out only) */}
        {isWeb && !isDesktop && (
          <IconButton onClick={openMobileWebNav} aria-label="Open menu">
            <Menu />
          </IconButton>
        )}

        {/* Logo */}
        <Link href={defaultPage.path} onClick={handleLogoClick}>
          <img
            src="/assets/images/logo.png"
            alt="logo"
            style={{ width: 40, borderRadius: `${theme.radius[2]}` }}
          />
        </Link>

        {/* Search */}
        {isLoggedIn && <SearchBar />}

        {/* Right controls */}
        <Stack direction="row" alignItems="center" spacing={theme.gap(8)}>
          {isWeb && isDesktop && (
            <WebNav
              style={{
                display: { xs: "none", md: "flex", flexDirection: "row" },
                gap: theme.gap(4),
              }}
            />
          )}

          <ThemeSwitcher />

          {isLoggedIn && isDesktop && <DesktopUserNav menuRef={menuRef} />}

          {isLoggedIn && (
            <UserAvatar
              userInfo={{ firstName, lastName, profileImage }}
              toolTipValue="Open menu"
              style={{ width: "30px", height: "30px" }}
              action={(e) =>
                isDesktop
                  ? menuRef.current?.openMenu(e.currentTarget)
                  : openMobileUserNav()
              }
            />
          )}

          {!isLoggedIn && (
            <AppButton
              href={routes.login}
              style={{ fontSize: "14px" }}
              onClick={(e) => {
                e.preventDefault();
                router.push(routes.login);
              }}>
              Login
            </AppButton>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

"use client";

import React, { useEffect } from "react";
import { AppBar, Stack, IconButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useGlobalStore, useMisc, usePage } from "@repo/shared-hooks";
import { DesktopNav, MobileNav } from "./Nav";
import { AnchorLink, AppButton } from "@repo/shared-ui";
import Image from "next/image";
import { Menu } from "lucide-react";
import { asset } from "@repo/assets";
import { CLIENT_ROUTES } from "@repo/core";

export const Header: React.FC = () => {
  const authStatus = useGlobalStore((state) => state.authStatus);
  const { openDrawer, closeDrawer, isDesktop, handleWindowResize } = useMisc();
  const { navigateTo } = usePage();
  const theme = useTheme();
  const isLoggedIn = authStatus === "AUTHENTICATED";

  /* ---------------------------------- effects --------------------------------- */
  useEffect(() => {
    window.addEventListener("resize", handleWindowResize);
    //  openMobileWebNav()
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  /* -------------------------------- handlers --------------------------------- */

  const openMobileWebNav = () =>
    openDrawer({
      content: (
        <MobileNav
          style={{
            gap: theme.gap(4),
          }}
        />
      ),
      source: "navbar",
      onClose: () => closeDrawer(),
      style: {
        base: { overlay: { padding: theme.boxSpacing(6) } },
        smallScreen: {
          overlay: { padding: theme.boxSpacing(0) },
          content: { height: "100%", width: "80%", borderRadius: "0px" },
        },
      },
    });

  /* ---------------------------------- render ---------------------------------- */
  return (
    <AppBar
      position="sticky"
      component="nav"
      aria-label="Main navigation"
      role="navigation"
      sx={{
        zIndex: 500,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "row",
        gap: theme.gap(6),
        borderBottom: `1px solid ${theme.palette.gray.trans[1]}`,
      }}>
      {/* Logo */}
      <AnchorLink
        url={CLIENT_ROUTES.about.path}
        onClick={() => navigateTo(CLIENT_ROUTES.about)}>
        <Image
          src={asset.logo}
          alt="logo"
          style={{
            width: 34,
            height: 34,
            borderRadius: `${theme.radius.full}`,
          }}
        />
      </AnchorLink>

      {/* Right controls */}
      {isDesktop && (
        <Stack direction="row" alignItems="center" spacing={theme.gap(8)}>
          <DesktopNav
            style={{
              display: { xs: "none", md: "flex", flexDirection: "row" },
              gap: theme.gap(4),
            }}
          />

          {isLoggedIn && (
            <AppButton
              href={CLIENT_ROUTES.home.path}
              variant="outlined"
              style={{ fontSize: "14px" }}
              onClick={() =>
                navigateTo(CLIENT_ROUTES.home, { type: "push", loadPage: true })
              }>
              Go to funstakes.com
            </AppButton>
          )}

          {authStatus === "UNAUTHENTICATED" && (
            <Stack direction="row" alignItems="center" spacing={theme.gap(0)}>
              <AppButton
                href={CLIENT_ROUTES.signup.path}
                style={{ fontSize: "14px" }}
                onClick={() =>
                  navigateTo(CLIENT_ROUTES.signup, {
                    type: "push",
                    savePage: false,
                    loadPage: true,
                  })
                }>
                Sign up
              </AppButton>
              <AppButton
                href={CLIENT_ROUTES.login.path}
                variant="outlined"
                style={{ fontSize: "14px" }}
                onClick={() =>
                  navigateTo(CLIENT_ROUTES.login, {
                    type: "push",
                    savePage: false,
                    loadPage: true,
                  })
                }>
                Login
              </AppButton>
            </Stack>
          )}
        </Stack>
      )}

      {/* Mobile hamburger (logged out only) */}
      {!isDesktop && (
        <IconButton onClick={openMobileWebNav} aria-label="Open menu">
          <Menu />
        </IconButton>
      )}
    </AppBar>
  );
};

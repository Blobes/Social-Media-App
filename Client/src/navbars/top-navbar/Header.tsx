"use client";

import React from "react";
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
import { DesktopUserNav } from "./DesktopUserNav";
import { SearchBar } from "../../components/Search";
import { UserAvatar } from "@/components/UserAvatar";
import { Menu } from "@mui/icons-material";
import { AppButton } from "../../components/Buttons";
import { useSharedHooks } from "../../hooks";
import { ThemeSwitcher } from "../../components/ThemeSwitcher";
import { defaultPage } from "@/helpers/info";
import { useRouter } from "next/navigation";
import { MobileUserNav } from "./MobileUserNav";
import { WebNav } from "./WebNav";

// Header component: Renders the top navigation bar, adapting to screen size and login state
export const Header: React.FC = () => {
  // Global app context
  const { loginStatus, authUser, setModalContent } = useAppContext();
  const { setLastPage } = useSharedHooks();
  const { firstName, lastName, profileImage } = authUser || {};

  // Theme and responsive breakpoint
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const router = useRouter();
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
        {/* Mobile & logged out user hamburger */}
        {!isLoggedIn && !isDesktop && (
          <IconButton
            onClick={() =>
              setModalContent({
                content: (
                  <WebNav
                    style={{
                      display: {
                        xs: "flex",
                        md: "none",
                      },
                      flexDirection: "column",
                      gap: theme.gap(4),
                    }}
                  />
                ),
              })
            }>
            <Menu />
          </IconButton>
        )}
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
        {isLoggedIn && <SearchBar />}

        {/* Right-side navigation stack */}
        <Stack direction="row" alignItems="center" spacing={theme.gap(8)}>
          {/* Navigation changes based on screen size */}
          {!isLoggedIn && isDesktop && (
            <WebNav
              style={{
                display: {
                  xs: "none",
                  md: "flex",
                },
                flexDirection: "row",
                gap: theme.gap(4),
              }}
            />
          )}

          {/* Right-side user controls */}
          <ThemeSwitcher />

          {isLoggedIn && !isDesktop && (
            // Show avatar if user is authenticated
            <UserAvatar
              userInfo={{ firstName, lastName, profileImage }}
              toolTipValue="Open menu"
              action={(e) =>
                setModalContent({
                  content: <MobileUserNav />,
                  style: {
                    overlay: {
                      display: {
                        xs: "flex",
                        md: "none",
                      },
                    },
                  },
                })
              }
              style={{
                width: "30px",
                height: "30px",
              }}
            />
          )}
          {isLoggedIn && isDesktop && <DesktopUserNav />}

          {!isLoggedIn && (
            // If not logged in, show login button and menu icon on mobile
            <AppButton
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                router.push("/auth/login");
              }}
              style={{ fontSize: "14px" }}
              href="/auth/login">
              Login
            </AppButton>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

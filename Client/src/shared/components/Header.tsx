"use client";
import React from "react";
import {
  Container,
  Typography,
  Stack,
  Button,
  IconButton,
  Divider,
  Box,
  StackProps,
  Link,
  AppBar,
  Toolbar,
} from "@mui/material";
import { useTheme, styled } from "@mui/material/styles";
import { Login } from "@/app/auth/login/Login";
import { MenuPopup } from "./Menus";
import { useAppContext } from "@/app/AppContext";
import { UserAvatar } from "@/app/user/components/UserAvatar";
import { ListItemType } from "../types";
import {
  AccountCircle,
  Home,
  Inbox,
  Logout,
  Message,
  Notifications,
  Settings,
} from "@mui/icons-material";
import { SearchBar } from "./Search";
import { useAuth } from "@/app/auth/authHooks";
import { Drawer } from "./Drawer";
import { MobileNavContents } from "./Contents";

type Item = {
  title: string;
  icon?: React.ReactNode;
  url?: string;
  action?: (title: string) => void;
};

export const Header: React.FC = () => {
  const { isLoggedIn, user, currentPage, setCurrentPage } = useAppContext();
  const { handleLogout } = useAuth();
  const theme = useTheme();

  const navItems: Item[] = [
    {
      title: "Home",
      icon: <Home />,
      url: "#",
    },
    {
      title: "Notifications",
      icon: <Notifications />,
      url: "#",
    },
    {
      title: "Inbox",
      icon: <Message />,
      url: "#",
    },
  ];
  const userItems: Item[] = [
    {
      title: "Settings",
      icon: <Settings />,
      url: "#",
    },
    {
      title: "Logout",
      icon: <Logout />,
      action: () => {
        handleLogout();
      },
    },
  ];
  const profileItem: Item = {
    title: "Profile",
    icon: <AccountCircle />,
    url: "#",
  };

  const mergedItems = [
    ...navItems,
    {
      title: "Divider",
      icon: <Divider />,
    } as Item,
    ...(isLoggedIn ? userItems : []),
  ];

  const ItemWrapper = styled(Link)<StackProps>(
    ({ theme, gap = theme.gap(2) }) =>
      theme.unstable_sx({
        width: "100%",
        display: "flex",
        flexDirection: "row",
        gap: gap as string,
        alignItems: "center",
        textDecoration: "none",
        padding: theme.boxSpacing(4, 9),
        color: theme.palette.gray[300],
        height: "40px",
      })
  );

  const mobileNavList: ListItemType[] = [];
  mergedItems.map((item, index) => {
    const Component =
      item.url || item.action ? (
        <ItemWrapper
          onClick={() => {
            const page =
              item.title.toLowerCase() === "logout"
                ? "home"
                : item.title.toLowerCase();
            setCurrentPage(page);
            localStorage.setItem("currentPage", page);
          }}
          sx={{
            backgroundColor:
              item.title.toLowerCase() === currentPage
                ? theme.palette.gray.trans[1]
                : "none",
          }}
          href={item.url && item.url}
          key={index}
          gap={theme.gap(6)}>
          {item.icon && item.icon}
          <Typography
            variant="button"
            sx={{
              marginTop: "3px",
            }}>
            {item.title}
          </Typography>
        </ItemWrapper>
      ) : (
        <>{item.icon && item.icon}</>
      );

    const data: ListItemType = {
      item: Component,
      action: item.action ? () => item.action!(item.title) : undefined,
    };
    mobileNavList.push(data);
  });

  const desktopNavList: ListItemType[] = [];
  [profileItem, ...userItems].map((item, index) => {
    const Component =
      item.url || item.action ? (
        <ItemWrapper
          onClick={() => {
            const page =
              item.title.toLowerCase() === "logout"
                ? "home"
                : item.title.toLowerCase();
            setCurrentPage(page);
            localStorage.setItem("currentPage", page);
          }}
          sx={{
            backgroundColor:
              item.title.toLowerCase() === currentPage
                ? theme.palette.gray.trans[1]
                : "none",
          }}
          href={item.url && item.url}
          key={index}
          gap={theme.gap(4)}>
          {item.icon && item.icon}
          <Typography
            variant="button"
            sx={{
              marginTop: "3px",
            }}>
            {item.title}
          </Typography>
        </ItemWrapper>
      ) : (
        <>{item.icon && item.icon}</>
      );

    const data: ListItemType = {
      item: Component,
      action: item.action ? () => item.action!(item.title) : undefined,
    };
    desktopNavList.push(data);
  });

  return (
    <AppBar position="sticky" sx={{ zIndex: 500 }}>
      <Toolbar
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${theme.palette.gray.trans[1]}`,
          padding: theme.boxSpacing(6, 10),
          gap: theme.gap(6),
        }}>
        {/* Header logo */}
        <img
          alt="logo"
          src="/assets/images/logo.png"
          style={{ borderRadius: `${theme.radius[2]}`, width: "40px" }}></img>
        {/* Search Bar */}
        <SearchBar />

        {/* Header menu naviagtion */}
        <Stack direction="row" alignItems="center" spacing={theme.gap(8)}>
          {/* Navigation menu on desktops and other larger screen sizes */}
          {isLoggedIn && (
            <React.Fragment>
              <Stack
                sx={{
                  flexDirection: "row",
                  gap: theme.gap(4),
                  [theme.breakpoints.down("md")]: { display: "none" },
                  [theme.breakpoints.up("md")]: { display: "flex" },
                }}>
                {navItems.map((item, index) => {
                  return item.url || item.action ? (
                    <ItemWrapper
                      onClick={() => {
                        setCurrentPage(item.title.toLowerCase());
                        localStorage.setItem(
                          "currentPage",
                          item.title.toLowerCase()
                        );
                      }}
                      href={item.url && item.url}
                      key={index}
                      gap={theme.gap(2)}
                      sx={{
                        backgroundColor:
                          item.title.toLowerCase() === currentPage
                            ? theme.palette.gray.trans[1]
                            : "none",
                        borderRadius: theme.radius[2],
                        transition: theme.transitions.create("background"),
                        "&:hover": {
                          backgroundColor: theme.palette.gray.trans[1],
                        },
                      }}>
                      {item.icon && item.icon}
                      <Typography
                        variant="button"
                        sx={{
                          marginTop: "3px",
                        }}>
                        {item.title}
                      </Typography>
                    </ItemWrapper>
                  ) : (
                    <React.Fragment>{item.icon && item.icon}</React.Fragment>
                  );
                })}
              </Stack>
              {/* User profile menu popup on desktops and other larger screen sizes */}
              <MenuPopup
                triggerElement={
                  <UserAvatar user={user} tootTipValue="Open menu" />
                }
                closeElement={
                  <UserAvatar user={user} tootTipValue="Close menu" />
                }
                listItems={desktopNavList}
                hide={{ xs: true, md: false }}
              />
            </React.Fragment>
          )}

          {/* Navigation & user profile menu popup on mobile and tablet screen sizes */}
          {!user || !isLoggedIn ? (
            <Login />
          ) : (
            <Drawer
              hide={{ xs: false, md: true }}
              triggerElement={
                <UserAvatar user={user} tootTipValue="Open menu" />
              }
              children={{
                contentElement: <MobileNavContents />,
              }}
            />
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

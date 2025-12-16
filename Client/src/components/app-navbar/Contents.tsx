"use client";

import React from "react";
import {
  Typography,
  Link,
  Divider,
  Stack,
  svgIconClasses,
} from "@mui/material";
import { useTheme, styled } from "@mui/material/styles";
import {
  Home,
  Notifications,
  Settings,
  Logout,
  AccountCircle,
  Mail,
} from "@mui/icons-material";
import { useAuth } from "@/app/auth/login/authHooks";
import { NavItem, GenericObject, SavedPage } from "@/types";
import { UserAvatar } from "../UserAvatar";
import { AppButton } from "../Buttons";
import { useAppContext } from "@/app/AppContext";
import { Strip } from "../StripBar";
import { summarizeNum } from "@/helpers/others";
import { defaultPage } from "@/helpers/info";
import { useRouter } from "next/navigation";

// Custom hook that centralizes nav content, styling, and reusable nav rendering
export const useContent = () => {
  const { handleLogout } = useAuth(); // Access logout logic
  const theme = useTheme(); // Access current theme for styling
  const { loginStatus } = useAppContext();

  // Navigation items visible to all users
  const defaultNavList: NavItem[] = [
    {
      title: loginStatus === "AUTHENTICATED" ? "Timeline" : "Home",
      element: <Home />,
      url: loginStatus === "AUTHENTICATED" ? "/timeline" : defaultPage.path,
    },
    {
      title: "Explore",
      element: <Notifications />,
      url: "#",
    },
  ];

  // Navigation items visible to only logged-in users
  const loggedInNavList: NavItem[] = [
    {
      title: "Profile",
      element: <AccountCircle />,
      url: "#",
    },
    {
      title: "Notifications",
      element: <Notifications />,
      url: "#",
    },
    {
      title: "Inbox",
      element: <Mail />,
      url: "#",
    },
    {
      element: <Divider />,
    },
    {
      title: "Settings",
      element: <Settings />,
      url: "#",
    },
    {
      element: <Divider />,
    },
    {
      title: "Logout",
      element: <Logout />,
      action: async () => await handleLogout(), // Trigger logout on click
    },
  ];

  // Styled wrapper for individual nav items
  const NavItemWrapper = styled(Link)(({ theme }) =>
    theme.unstable_sx({
      display: "flex",
      alignItems: "center",
      gap: theme.gap(2),
      textDecoration: "none",
      padding: theme.boxSpacing(2, 6),
      color: theme.palette.gray[300],
      cursor: "pointer",
      borderRadius: theme.radius[2],
      transition: theme.transitions.create("background"),
      "&:hover, &:focus": {
        backgroundColor: theme.palette.gray.trans[1],
        outline: "none",
      },
    })
  );

  // Props for the reusable nav renderer
  interface RenderListProps {
    list: NavItem[];
    lastPage: SavedPage;
    setLastPage: (page: SavedPage) => void;
    closePopup?: () => void;
    style?: GenericObject<string>;
  }
  // Renders a nav list (either default or logged-in) with accessibility support
  const RenderList: React.FC<RenderListProps> = ({
    list,
    lastPage,
    setLastPage,
    closePopup,
    style = {},
  }) => {
    const router = useRouter();
    return (
      <React.Fragment>
        {list.map((item, index) => {
          if (!item.title && item.element) {
            // Render the "element" alone if there's no title (Divider, custom element, etc.)
            return <React.Fragment key={index}>{item.element}</React.Fragment>;
          }

          const isCurrent = item.title?.toLowerCase() === lastPage.title;
          return (
            <NavItemWrapper
              key={index}
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                router.push(item.url ?? "#");
                if (item.action) item.action();
                if (item.title)
                  setLastPage({
                    title: item.title.toLowerCase(),
                    path: `/${item.title.toLowerCase()}`,
                  });
                if (closePopup) closePopup();
              }}
              aria-current={isCurrent ? "page" : undefined}
              role="link"
              tabIndex={0}
              sx={{
                backgroundColor: isCurrent
                  ? theme.palette.gray.trans[1]
                  : "none",
                ...style,
              }}>
              {item.element}
              {item.title && (
                <Typography variant="button">{item.title}</Typography>
              )}
            </NavItemWrapper>
          );
        })}
      </React.Fragment>
    );
  };

  // Mobile-specific wrapper for the same RenderList
  // User info
  const UserInfo = () => {
    const authUser = useAppContext().authUser;
    if (!authUser) return null;

    const {
      firstName,
      lastName,
      profileImage,
      username,
      followers,
      following,
    } = authUser;
    return (
      <Stack>
        <Stack
          sx={{
            gap: theme.gap(4),
            flexDirection: "row",
            alignItems: "center",
          }}>
          <UserAvatar
            style={{ width: "40px", height: "40px" }}
            userInfo={{ firstName, lastName, profileImage }}
          />
          <Stack sx={{ gap: theme.gap(0), width: "100%" }}>
            <Typography variant="body1">
              {firstName} {lastName}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.gray[200] }}>
              {username}
            </Typography>
          </Stack>
          <AppButton
            variant="outlined"
            style={{
              fontSize: "13px",
              padding: theme.boxSpacing(1, 4),
              borderColor: theme.palette.gray[100],
            }}>
            Profile
          </AppButton>
        </Stack>
        <Divider />
        <Strip
          style={{
            paddingX: theme.boxSpacing(4),
            justifyContent: "space-between",
          }}
          items={[
            {
              text: followers?.length! > 1 ? " Followers" : " Follower",
              element: (
                <strong style={{ color: theme.palette.gray[300] as string }}>
                  {summarizeNum(followers?.length!)}
                </strong>
              ),
            },
            {
              text: " Following",
              element: (
                <strong style={{ color: theme.palette.gray[300] as string }}>
                  {summarizeNum(following?.length!)}
                </strong>
              ),
            },
            {
              text: " Likes",
              element: (
                <strong style={{ color: theme.palette.gray[300] as string }}>
                  {summarizeNum(3)}
                </strong>
              ),
            },
          ]}
        />
      </Stack>
    );
  };

  const MobileNavContent: React.FC<RenderListProps> = ({
    list,
    lastPage: currentPage,
    setLastPage: setCurrentPage,
    closePopup,
  }) => {
    return (
      <Stack sx={{ padding: theme.boxSpacing(6) }}>
        <UserInfo />
        <Divider />
        <RenderList
          lastPage={currentPage}
          setLastPage={setCurrentPage}
          list={list}
          closePopup={closePopup}
          style={{
            gap: theme.gap(10),
            [`& .${svgIconClasses.root}`]: {
              fill: theme.palette.gray[200],
              width: "22px",
              height: "22px",
            },
          }}
        />
      </Stack>
    );
  };

  return { defaultNavList, loggedInNavList, RenderList, MobileNavContent };
};

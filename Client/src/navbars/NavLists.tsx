"use client";
import { useAuth } from "@/app/auth/login/authHooks";
import { defaultPage, routes } from "@/helpers/info";
import { NavItem } from "@/types";
import {
  Home,
  Notifications,
  Settings,
  Logout,
  AccountCircle,
  Mail,
} from "@mui/icons-material";
import { Divider } from "@mui/material";
export const useNavLists = () => {
  const { handleLogout } = useAuth();

  // Web navigation list visible to all users on the web
  const webNavList: NavItem[] = [
    {
      title: "About",
      element: <Home />,
      url: routes.about,
    },
    {
      title: "Pricing",
      element: <Notifications />,
      url: routes.pricing,
    },
    {
      title: "Blogs",
      element: <Notifications />,
      url: routes.blogs,
    },
    {
      title: "Support",
      element: <Notifications />,
      url: routes.support,
    },
  ];

  // User profile navigation list visible to only logged-in users
  const userNavList: NavItem[] = [
    {
      title: "Update Status",
      element: <Notifications />,
    },
    {
      element: <Divider />,
    },
    {
      title: "Profile",
      element: <AccountCircle />,
      url: routes.profile,
    },
    {
      title: "Bookmarks",
      element: <Mail />,
      url: routes.bookmarks,
    },

    {
      element: <Divider />,
    },
    {
      title: "Premium",
      element: <Mail />,
      url: routes.pricing,
    },
    {
      title: "Logout",
      element: <Logout />,
      action: async () => await handleLogout(),
    },
  ];

  // Left Sidebar navigation list visible to only logged-in users
  const sidebarNavList: NavItem[] = [
    {
      title: "Timeline",
      element: <AccountCircle />,
      url: routes.timeline,
    },
    {
      title: "Stakes",
      element: <AccountCircle />,
      url: routes.stakes,
    },
    {
      title: "Explore",
      element: <Notifications />,
      url: routes.explore,
    },
    {
      title: "Inbox",
      element: <Mail />,
      url: routes.inbox,
    },
    {
      element: <Divider />,
    },
    {
      title: "Settings",
      element: <Settings />,
      url: routes.settings,
    },
  ];

  return { webNavList, userNavList, sidebarNavList };
};

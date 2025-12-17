"use client";
import { useAuth } from "@/app/auth/login/authHooks";
import { defaultPage } from "@/helpers/info";
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
      url: "/about",
    },
    {
      title: "Pricing",
      element: <Notifications />,
      url: "/pricing",
    },
    {
      title: "News & Blogs",
      element: <Notifications />,
      url: "/blogs",
    },
    {
      title: "Support",
      element: <Notifications />,
      url: "/support",
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
      url: "/profile",
    },
    {
      title: "Bookmarks",
      element: <Mail />,
      url: "/bookmarks",
    },

    {
      element: <Divider />,
    },
    {
      title: "Premium",
      element: <Mail />,
      url: "/pricing",
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
      url: "/timeline",
    },
    {
      title: "Stakes",
      element: <AccountCircle />,
      url: "/stakes",
    },
    {
      title: "Explore",
      element: <Notifications />,
      url: "/explore",
    },
    {
      title: "Inbox",
      element: <Mail />,
      url: "/inbox",
    },
    {
      element: <Divider />,
    },
    {
      title: "Settings",
      element: <Settings />,
      url: "/settings",
    },
  ];

  return { webNavList, userNavList, sidebarNavList };
};

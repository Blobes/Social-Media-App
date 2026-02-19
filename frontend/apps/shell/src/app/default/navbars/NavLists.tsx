"use client";

import { clientRoutes } from "@funstakes/helpers";
import { INavItem } from "@funstakes/types";
import {
  AudioLines, Bell, Bookmark, CircleDashed, Gem, House, Mail, Pentagon,
  Search, Settings, User, WalletMinimal
} from "lucide-react";

export const useNavLists = () => {
  // User profile navigation list visible to only logged-in users
  const userNavList: INavItem[] = [
    {
      title: clientRoutes.profile.title,
      element: <User />,
      url: clientRoutes.profile.path,
    },
    {
      title: clientRoutes.pricing.title,
      element: <Gem />,
      url: clientRoutes.pricing.path,
    },
    {
      title: clientRoutes.wallet.title,
      element: <WalletMinimal />,
      url: clientRoutes.wallet.path,
    },
    {
      title: clientRoutes.bookmarks.title,
      element: <Bookmark />,
      url: clientRoutes.bookmarks.path,
    },
    {
      title: clientRoutes.settings.title,
      element: <Settings />,
      url: clientRoutes.settings.path,
    },
  ];

  // Left Sidebar navigation list visible to only logged-in users
  const sidebarNavList: INavItem[] = [
    {
      title: clientRoutes.home.title,
      element: <House />,
      url: clientRoutes.home.path,
    },
    {
      title: clientRoutes.explore.title,
      element: <Search />,
      url: clientRoutes.explore.path,
    },
    {
      title: clientRoutes.stakes.title,
      element: <Pentagon />,
      url: clientRoutes.stakes.path,
    },
    {
      title: clientRoutes.vibes.title,
      element: <CircleDashed />,
      url: clientRoutes.vibes.path,
    },
    {
      title: clientRoutes.voices.title,
      element: <AudioLines />,
      url: clientRoutes.voices.path,
    },
    {
      title: clientRoutes.notifications.title,
      element: <Bell />,
      url: clientRoutes.notifications.path,
    },
    {
      title: clientRoutes.inbox.title,
      element: <Mail />,
      url: clientRoutes.inbox.path,
    },
  ];

  return { userNavList, sidebarNavList };
};

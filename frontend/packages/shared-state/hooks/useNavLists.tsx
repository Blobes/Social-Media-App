"use client";

import { clientRoutes } from "../../_helpers";
import { INavItem } from "@repo/types";
import {
  BadgeQuestionMark, AudioLines, Bell, Bookmark, CircleDashed, Gem, House, Mail, Pentagon,
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

  const headerNavList: INavItem[] = [
    {
      title: clientRoutes.support.title,
      element: <BadgeQuestionMark />,
      url: clientRoutes.support.path,
    },
    {
      title: clientRoutes.pricing.title,
      element: <Gem />,
      url: clientRoutes.pricing.path,
    },
  ];

  const footerNavList: INavItem[] = [
    {
      title: clientRoutes.about.title,
      url: clientRoutes.about.path,
    },
    {
      title: clientRoutes.support.title,
      url: clientRoutes.support.path,
    },
    {
      title: clientRoutes.pricing.title,
      url: clientRoutes.pricing.path,
    },
    {
      title: clientRoutes.blogs.title,
      url: clientRoutes.blogs.path,
    },
    {
      title: clientRoutes.privacy.title,
      url: clientRoutes.privacy.path,
    },
    {
      title: clientRoutes.terms.title,
      url: clientRoutes.terms.path,
    },
    {
      title: clientRoutes.news.title,
      url: clientRoutes.news.path,
    },
  ];


  return { userNavList, sidebarNavList, headerNavList, footerNavList };
};

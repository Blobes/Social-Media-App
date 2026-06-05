"use client";

import React from "react";
import {
  BadgeQuestionMark,
  AudioLines,
  Bell,
  Bookmark,
  CircleDashed,
  Gem,
  House,
  Mail,
  Pentagon,
  Search,
  Settings,
  User,
  WalletMinimal,
} from "lucide-react";
import { CLIENT_ROUTES } from "./routes";
import { COUNTRIES } from "./countries";
import { IMenuItem } from "../types/ui-state";
import { ICountryItem, ListType } from "../types/ui-props";

export const LISTS = () => {
  // User profile navigation list visible to only logged-in users
  const USER_NAV_LIST: IMenuItem[] = [
    {
      title: CLIENT_ROUTES.profile.title,
      element: <User />,
      url: CLIENT_ROUTES.profile.path,
    },
    {
      title: CLIENT_ROUTES.pricing.title,
      element: <Gem />,
      url: CLIENT_ROUTES.pricing.path,
    },
    {
      title: CLIENT_ROUTES.wallet.title,
      element: <WalletMinimal />,
      url: CLIENT_ROUTES.wallet.path,
    },
    {
      title: CLIENT_ROUTES.bookmarks.title,
      element: <Bookmark />,
      url: CLIENT_ROUTES.bookmarks.path,
    },
    {
      title: CLIENT_ROUTES.settings.title,
      element: <Settings />,
      url: CLIENT_ROUTES.settings.path,
    },
  ];

  // Left Sidebar navigation list visible to only logged-in users
  const SIDEBAR_NAV_LIST: IMenuItem[] = [
    {
      title: CLIENT_ROUTES.home.title,
      element: <House />,
      url: CLIENT_ROUTES.home.path,
    },
    {
      title: CLIENT_ROUTES.explore.title,
      element: <Search />,
      url: CLIENT_ROUTES.explore.path,
    },
    {
      title: CLIENT_ROUTES.stakes.title,
      element: <Pentagon />,
      url: CLIENT_ROUTES.stakes.path,
    },
    {
      title: CLIENT_ROUTES.vibes.title,
      element: <CircleDashed />,
      url: CLIENT_ROUTES.vibes.path,
    },
    {
      title: CLIENT_ROUTES.voices.title,
      element: <AudioLines />,
      url: CLIENT_ROUTES.voices.path,
    },
    {
      title: CLIENT_ROUTES.notifications.title,
      element: <Bell />,
      url: CLIENT_ROUTES.notifications.path,
    },
    {
      title: CLIENT_ROUTES.inbox.title,
      element: <Mail />,
      url: CLIENT_ROUTES.inbox.path,
    },
  ];

  const HEADER_NAV_LIST: IMenuItem[] = [
    {
      title: CLIENT_ROUTES.support.title,
      element: <BadgeQuestionMark />,
      url: CLIENT_ROUTES.support.path,
    },
    {
      title: CLIENT_ROUTES.pricing.title,
      element: <Gem />,
      url: CLIENT_ROUTES.pricing.path,
    },
  ];

  const FOOTER_NAV_LIST: IMenuItem[] = [
    {
      title: CLIENT_ROUTES.about.title,
      url: CLIENT_ROUTES.about.path,
    },
    {
      title: CLIENT_ROUTES.support.title,
      url: CLIENT_ROUTES.support.path,
    },
    {
      title: CLIENT_ROUTES.pricing.title,
      url: CLIENT_ROUTES.pricing.path,
    },
    {
      title: CLIENT_ROUTES.blogs.title,
      url: CLIENT_ROUTES.blogs.path,
    },
    {
      title: CLIENT_ROUTES.privacy.title,
      url: CLIENT_ROUTES.privacy.path,
    },
    {
      title: CLIENT_ROUTES.terms.title,
      url: CLIENT_ROUTES.terms.path,
    },
    {
      title: CLIENT_ROUTES.news.title,
      url: CLIENT_ROUTES.news.path,
    },
  ];

  const COUNTRY_LIST: ICountryItem[] = Object.values(COUNTRIES).map(
    (country) => ({
      ...country,
      id: `${country.iso}${country.code}`,
      title: `${country.iso} (${country.code})`,
      code: country.code,
      type: "BUTTON" as const,
      element: <span style={{ fontSize: "20px" }}>{country.flag}</span>,
    }),
  );

  const MESSAGES = {
    [ListType.COUNTRY]: {
      empty: "No country found.",
      noMatch: "No country matches your search.",
    },
    [ListType.NAVIGATION]: {
      empty: "Navigation menu is empty.",
      noMatch: "No menu items found.",
    },
    [ListType.TOPICS]: {
      empty: "Add topics to this post.",
      noMatch: "No matching topics.",
    },
    [ListType.DEFAULT]: {
      empty: "No items found.",
      noMatch: "No results match your search.",
    },
  };

  const CREATE_POST_LIST: IMenuItem[] = [
    {
      title: "Gist",
      element: <BadgeQuestionMark />,
    },
    {
      title: "Stake",
      element: <Gem />,
    },
    {
      title: "Vibez",
      element: <Gem />,
    },
  ];

  return {
    USER_NAV_LIST,
    SIDEBAR_NAV_LIST,
    HEADER_NAV_LIST,
    FOOTER_NAV_LIST,
    COUNTRY_LIST,
    MESSAGES,
    CREATE_POST_LIST,
  };
};

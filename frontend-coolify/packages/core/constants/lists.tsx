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
import { CLIENT_ROUTES } from "./routesConfig";
import { COUNTRIES } from "./countries";
import { IMenuItem } from "../types/ui-state";
import { ICountryItem, ITranslation, ListType } from "../types/ui-props";
import { COMMON_LIST } from "./msgRegistry";
import { useTheme } from "@mui/material/styles";

export const LISTS = (translator?: (transData: ITranslation) => string) => {
  const theme = useTheme();
  // User profile navigation list visible to only logged-in users
  const translate = (transData: ITranslation) => {
    return translator ? translator(transData) : transData.tValue;
  };

  const USER_NAV_LIST: IMenuItem[] = [
    {
      title: translate(COMMON_LIST.nav.profile),
      element: <User />,
      url: CLIENT_ROUTES.profile.path,
    },
    {
      title: translate(COMMON_LIST.nav.pricing),
      element: <Gem />,
      url: CLIENT_ROUTES.pricing.path,
    },
    {
      title: translate(COMMON_LIST.nav.wallet),
      element: <WalletMinimal />,
      url: CLIENT_ROUTES.wallet.path,
    },
    {
      title: translate(COMMON_LIST.nav.bookmarks),
      element: <Bookmark />,
      url: CLIENT_ROUTES.bookmarks.path,
    },
    {
      title: translate(COMMON_LIST.nav.settings),
      element: <Settings />,
      url: CLIENT_ROUTES.settings.path,
    },
  ];

  // Left Sidebar navigation list visible to only logged-in users
  const SIDEBAR_NAV_LIST: IMenuItem[] = [
    {
      title: translate(COMMON_LIST.nav.home),
      element: <House />,
      url: CLIENT_ROUTES.home.path,
    },
    {
      title: translate(COMMON_LIST.nav.explore),
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
      title: translate(COMMON_LIST.nav.notifications),
      element: <Bell />,
      url: CLIENT_ROUTES.notifications.path,
    },
    {
      title: translate(COMMON_LIST.nav.inbox),
      element: <Mail />,
      url: CLIENT_ROUTES.inbox.path,
    },
  ];

  const HEADER_NAV_LIST: IMenuItem[] = [
    {
      title: translate(COMMON_LIST.nav.support),
      element: <BadgeQuestionMark />,
      url: CLIENT_ROUTES.support.path,
    },
    {
      title: translate(COMMON_LIST.nav.pricing),
      element: <Gem />,
      url: CLIENT_ROUTES.pricing.path,
    },
  ];

  const FOOTER_NAV_LIST: IMenuItem[] = [
    {
      title: translate(COMMON_LIST.nav.about),
      url: CLIENT_ROUTES.about.path,
    },
    {
      title: translate(COMMON_LIST.nav.support),
      url: CLIENT_ROUTES.support.path,
    },
    {
      title: translate(COMMON_LIST.nav.pricing),
      url: CLIENT_ROUTES.pricing.path,
    },
    {
      title: translate(COMMON_LIST.nav.blogs),
      url: CLIENT_ROUTES.blogs.path,
    },
    {
      title: translate(COMMON_LIST.nav.privacy),
      url: CLIENT_ROUTES.privacy.path,
    },
    {
      title: translate(COMMON_LIST.nav.terms),
      url: CLIENT_ROUTES.terms.path,
    },
    {
      title: translate(COMMON_LIST.nav.news),
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
      element: (
        <span style={{ ...theme.typography.text2 }}>{country.flag}</span>
      ),
    }),
  );

  const MESSAGES = {
    [ListType.COUNTRY]: {
      empty: translate(COMMON_LIST.msg.country_empty),
      noMatch: translate(COMMON_LIST.msg.country_no_match),
    },
    [ListType.NAVIGATION]: {
      empty: translate(COMMON_LIST.msg.navigation_empty),
      noMatch: translate(COMMON_LIST.msg.navigation_no_match),
    },
    [ListType.TOPICS]: {
      empty: translate(COMMON_LIST.msg.topics_empty),
      noMatch: translate(COMMON_LIST.msg.topics_no_match),
    },
    [ListType.DEFAULT]: {
      empty: translate(COMMON_LIST.msg.default_empty),
      noMatch: translate(COMMON_LIST.msg.default_no_match),
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

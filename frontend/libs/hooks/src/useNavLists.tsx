"use client";

import { clientRoutes } from "@funstakes/helpers";
import { INavItem } from "libs/type/type";
import { BadgeQuestionMark, Gem, } from "lucide-react";

export const useNavLists = () => {

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


  return { headerNavList, footerNavList };
};

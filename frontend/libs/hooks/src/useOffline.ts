"use client";

import { usePage } from "./usePage";
import { useGlobalContext } from "@funstakes/shared-state";
import { clientRoutes, getFromLocalStorage } from "@funstakes/helpers";
import { IPage } from "libs/type/type";

export const useOffline = () => {
  const { setOfflineMode } = useGlobalContext();
  const { navigateTo } = usePage();

  const switchToOfflineMode = () => {
    setOfflineMode(true);
    setTimeout(() => {
      navigateTo(clientRoutes.offline, {
        type: "element",
        savePage: false,
        loadPage: true,
      });
    }, 10);
  };

  const switchToOnlineMode = () => {
    setOfflineMode(false);
    const savedPage = getFromLocalStorage<IPage>() || clientRoutes.home;
    navigateTo(savedPage, { type: "element", loadPage: true });
  };

  return {
    switchToOfflineMode,
    switchToOnlineMode,
  };
};

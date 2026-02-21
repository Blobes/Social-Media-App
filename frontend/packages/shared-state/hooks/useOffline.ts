"use client";

import { usePage } from "./usePage";
import { useGlobalContext } from "../GlobalContext";
import { clientRoutes, getFromLocalStorage } from "@repo/helpers";
import { IPage } from "@repo/types";

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

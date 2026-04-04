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

    navigateTo(clientRoutes.offline, {
      type: "push",
      savePage: false,
      loadPage: true,
    });
  };

  const switchToOnlineMode = () => {
    setOfflineMode(false);
    const savedPage = getFromLocalStorage<IPage>() || clientRoutes.home;
    navigateTo(savedPage, { type: "replace", loadPage: true });
  };

  return {
    switchToOfflineMode,
    switchToOnlineMode,
  };
};

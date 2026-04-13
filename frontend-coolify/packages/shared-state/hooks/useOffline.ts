"use client";

import { usePage } from "./usePage";
import { useGlobalContext } from "../GlobalContext";
import { getFromLocalStorage } from "@repo/helpers";
import { CLIENT_ROUTES, IPage } from "@repo/core";

export const useOffline = () => {
  const { setOfflineMode } = useGlobalContext();
  const { navigateTo } = usePage();

  const switchToOfflineMode = () => {
    setOfflineMode(true);

    navigateTo(CLIENT_ROUTES.offline, {
      type: "push",
      savePage: false,
      loadPage: true,
    });
  };

  const switchToOnlineMode = () => {
    setOfflineMode(false);
    const savedPage = getFromLocalStorage<IPage>() || CLIENT_ROUTES.home;
    navigateTo(savedPage, { type: "replace", loadPage: true });
  };

  return {
    switchToOfflineMode,
    switchToOnlineMode,
  };
};

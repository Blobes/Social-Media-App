"use client";

import { useGlobalContext } from "../GlobalContext";
import { IPage } from "@repo/types";
import {
  clientRoutes,
  disallowedRoutes,
  routesRegistry,
  delay,
  extractPageTitle,
  getFromLocalStorage,
  crossZoneCheck,
} from "@repo/helpers";
import { usePathname, useRouter } from "next/navigation";
import { useMisc } from "./useMisc";

export const usePage = () => {
  const { setPage, lastPage, drawerContent, modalContent, setGlobalLoading } =
    useGlobalContext();
  const { closeDrawer, closeModal } = useMisc();
  const router = useRouter();

  const isOnWeb = (path: string) => routesRegistry.web.includes(path);
  const isOnAuth = (path: string) => routesRegistry.auth.includes(path);
  const isOnOffline = (path: string) => routesRegistry.offline.includes(path);
  const isOnDisallowedRoutes = (path: string) =>
    disallowedRoutes.includes(path);
  const pathname = usePathname();

  const setLastPage = ({ title, path }: IPage) => {
    const page = { title, path };
    setPage(page);
    localStorage.setItem("saved_page", JSON.stringify(page));
  };

  interface NavigateOptions {
    type?: "push" | "replace";
    savePage?: boolean;
    loadPage?: boolean;
    event?: React.MouseEvent;
  }
  const navigateTo = async (page: IPage, options: NavigateOptions = {}) => {
    const { type, savePage = true, loadPage = false, event } = options;

    if (event) event.preventDefault();

    const isCrossZone = crossZoneCheck(page.path);

    if (drawerContent) closeDrawer();
    if (modalContent) closeModal();
    if (savePage) setLastPage(page);

    // Cross zone dynamic navigation
    if (isCrossZone) {
      if (loadPage) setGlobalLoading(true);
      if (type === "replace") window.location.replace(page.path);
      else window.location.assign(page.path);
      return;
    }

    // INTERNAL: Standard Next.js SPA navigation
    if (loadPage) {
      setGlobalLoading(true);
      await delay(2000);
      setGlobalLoading(false);
    }

    if (type === "push") router.push(page.path);
    if (type === "replace") router.replace(page.path);

    return;
  };

  const handleCurrentPage = () => {
    const isOnAuthRoute = isOnAuth(pathname);
    const isOnOfflineRoute = isOnOffline(pathname);
    const savedPage = getFromLocalStorage<IPage>();
    const pagePath =
      !isOnAuthRoute && !isOnOfflineRoute ? pathname : lastPage.path;

    setLastPage(
      isOnAuthRoute && savedPage
        ? savedPage
        : { title: extractPageTitle(pagePath), path: pagePath },
    );

    if (isOnDisallowedRoutes(pathname)) {
      router.replace(clientRoutes.about.path);
      return;
    }
  };

  return {
    setLastPage,
    isOnWeb,
    isOnAuth,
    navigateTo,
    handleCurrentPage,
    isOnDisallowedRoutes,
    isOnOffline,
  };
};

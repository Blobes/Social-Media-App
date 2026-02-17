"use client";

import { useGlobalContext } from "@funstakes/shared-state";
import { IPage } from "@funstakes/types";
import {
  clientRoutes,
  disallowedRoutes,
  registeredRoutes,
  delay,
  extractPageTitle,
  getFromLocalStorage,
} from "@funstakes/helpers";
import { usePathname, useRouter } from "next/navigation";
import { useMisc } from "./useMisc";

export const usePage = () => {
  const { setPage, lastPage, drawerContent, modalContent, setGlobalLoading } =
    useGlobalContext();
  const { closeDrawer, closeModal } = useMisc();
  const router = useRouter();

  const isOnWeb = (path: string) => registeredRoutes.web.includes(path);
  const isOnAuth = (path: string) => registeredRoutes.auth.includes(path);
  const isOnOffline = (path: string) => registeredRoutes.offline.includes(path);
  const isOnDisallowedRoutes = (path: string) =>
    disallowedRoutes.includes(path);
  const pathname = usePathname();

  const setLastPage = ({ title, path }: IPage) => {
    const pageInfo = { title: title, path: path };
    setPage(pageInfo);
    localStorage.setItem("saved_page", JSON.stringify(pageInfo));
  };

  interface NavigateOptions {
    type?: "element" | "link";
    savePage?: boolean;
    loadPage?: boolean;
    event?: React.MouseEvent;
  }
  const navigateTo = async (page: IPage, options: NavigateOptions = {}) => {
    const type = options.type ?? "link";
    const savePage = options.savePage ?? true;
    const loadPage = options.loadPage ?? false;

    if (drawerContent) closeDrawer();
    if (modalContent) closeModal();

    if (loadPage) {
      setGlobalLoading(true);
      if (type === "element") {
        options.event?.preventDefault();
        router.push(page.path);
      }
      await delay(2000);
      setGlobalLoading(false);
      return; // Exit early since we already pushed
    }

    if (savePage) setLastPage(page);

    if (type === "element") {
      options.event?.preventDefault();
      router.push(page.path);
    }
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

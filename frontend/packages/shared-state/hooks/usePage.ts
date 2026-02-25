"use client";

import { useGlobalContext } from "../GlobalContext";
import { IPage } from "@repo/types";
import {
  clientRoutes,
  disallowedRoutes,
  registeredRoutes,
  delay,
  extractPageTitle,
  getFromLocalStorage,
} from "@repo/helpers";
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
    const page = { title, path };
    setPage(page);
    localStorage.setItem("saved_page", JSON.stringify(page));
  };

  interface NavigateOptions {
    type?: "push" | "href" | "replace";
    savePage?: boolean;
    loadPage?: boolean;
    event?: React.MouseEvent;
    isExternal?: boolean;
  }
  const navigateTo = async (page: IPage, options: NavigateOptions = {}) => {
    const {
      type = "href",
      savePage = true,
      loadPage = false,
      event,
      isExternal = false,
    } = options;

    if (drawerContent) closeDrawer();
    if (modalContent) closeModal();

    if (savePage) setLastPage(page);

    if (loadPage) {
      setGlobalLoading(true);
      await delay(2000);
      setGlobalLoading(false);
    }

    if (event) event.preventDefault();

    if (type !== "href") {
      if (!isExternal)
        type === "push" ? router.push(page.path) : router.replace(page.path);
      else window.location.assign(page.path);
    }
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

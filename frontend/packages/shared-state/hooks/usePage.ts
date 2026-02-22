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
    const pageInfo = { title: title, path: path };
    setPage(pageInfo);
    localStorage.setItem("saved_page", JSON.stringify(pageInfo));
  };

  interface NavigateOptions {
    type?: "element" | "link";
    savePage?: boolean;
    loadPage?: boolean;
    event?: React.MouseEvent;
    external?: boolean;
  }
  const navigateTo = async (page: IPage, options: NavigateOptions = {}) => {
    const {
      type = "link",
      savePage = true,
      loadPage = false,
      external = false,
      event,
    } = options;

    if (drawerContent) closeDrawer();
    if (modalContent) closeModal();
    if (event && type === "element") event.preventDefault();

    if (savePage) setLastPage(page);

    if (loadPage) {
      setGlobalLoading(true);
      await delay(2000);
      !external && setGlobalLoading(false);
    }
    external ? (window.location.href = page.path) : router.push(page.path);
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

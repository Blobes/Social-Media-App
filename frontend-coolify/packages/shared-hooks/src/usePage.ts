"use client";

import { useCallback, useState } from "react";
import { DISALLOWED_ROUTES, IPage, ROUTES_REGISTRY } from "@repo/core";
import {
  extractPageTitle,
  getFromLocalStorage,
  crossZoneCheck,
  saveToLocalStorage,
  delay,
} from "@repo/helpers";
import { usePathname, useRouter } from "next/navigation";
import { useMisc } from "./useMisc";
import { useGlobalStore } from "./store/useGlobalStore";
import { REDIRECT_MAP, useRouteGuards } from "./useRouteGuards";

interface NavigateOptions {
  type?: "push" | "replace";
  savePage?: boolean;
  loadPage?: boolean;
  event?: React.MouseEvent;
}

/**
 * Manages page transitions, routing logic, and navigation state.
 */
export const usePage = () => {
  const setGlobalLoading = useGlobalStore((state) => state.setGlobalLoading);
  const drawerContent = useGlobalStore((state) => state.drawerContent);
  const modalContent = useGlobalStore((state) => state.modalContent);
  const setPage = useGlobalStore((state) => state.setPage);
  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const { closeDrawer, closeModal } = useMisc();
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Helper functions for route classification.
   */
  const isOnWeb = useCallback(
    (path: string) => ROUTES_REGISTRY.web.includes(path),
    [],
  );
  const isOnAuth = useCallback(
    (path: string) => ROUTES_REGISTRY.auth.includes(path),
    [],
  );
  const isOnOffline = useCallback(
    (path: string) => ROUTES_REGISTRY.offline.includes(path),
    [],
  );
  const isOnDisallowed = useCallback(
    (path: string) => DISALLOWED_ROUTES.includes(path),
    [],
  );
  const isOnExternal = useCallback(
    (path: string) => ROUTES_REGISTRY.external.includes(path),
    [],
  );

  /**
   * Persists the last visited page to state and local storage.
   */
  const setLastPage = useCallback(
    ({ title, path }: IPage) => {
      const page = { title, path };
      setPage(page);
      saveToLocalStorage("saved_page", page);
    },
    [setPage],
  );

  const isAuthRoute = isOnAuth(pathname);
  const isOfflineRoute = isOnOffline(pathname);
  const routeGuards = useRouteGuards(pathname, pendingPath);

  /**
   * Core navigation handler managing SPA transitions and cross-zone jumps.
   */
  const navigateTo = useCallback(
    async (page: IPage, options: NavigateOptions = {}) => {
      const {
        type = "push",
        savePage = true,
        loadPage = false,
        event,
      } = options;
      const isCrossZone = crossZoneCheck(page.path);
      setPendingPath(page.path);

      if (event) event.preventDefault();

      if (loadPage || isCrossZone) setGlobalLoading(true);

      // UI Cleanup
      if (drawerContent) closeDrawer();
      if (modalContent) closeModal();

      if (savePage) setLastPage(page);

      // EXTERNAL: Cross-zone or Root dynamic navigation
      if (isCrossZone) {
        window.location.assign(page.path);
        return;
      }

      // INTERNAL: Standard Next.js SPA navigation
      if (type === "push") router.push(page.path);
      if (type === "replace") router.replace(page.path);

      // Ensure loading is reset after navigation triggers
      if (loadPage) await delay(400);
      setPendingPath(null);
      setGlobalLoading(false);
    },
    [
      drawerContent,
      modalContent,
      closeDrawer,
      closeModal,
      setLastPage,
      setGlobalLoading,
      router,
    ],
  );

  /**
   * Synchronizes route change and enforces access control.
   */
  const handlePageChange = useCallback(() => {
    setInlineMsg(null);
    setPendingPath(null);
    setGlobalLoading(false);

    if (routeGuards.isRedirecting) {
      const redirect = REDIRECT_MAP.find(({ guard }) => routeGuards[guard]);
      if (redirect)
        navigateTo(redirect.target, { loadPage: true, savePage: false });
      return;
    }
    if (isAuthRoute || isOfflineRoute) return;

    const savedPage = getFromLocalStorage<IPage>();
    setLastPage(
      savedPage ?? { title: extractPageTitle(pathname), path: pathname },
    );
  }, [
    routeGuards,
    pathname,
    isAuthRoute,
    isOfflineRoute,
    setLastPage,
    setInlineMsg,
    navigateTo,
  ]);

  return {
    setLastPage,
    isOnWeb,
    isOnAuth,
    isOnDisallowed,
    isOnExternal,
    navigateTo,
    handlePageChange,
    ...routeGuards,
  };
};

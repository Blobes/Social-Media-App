"use client";

import { useCallback } from "react";
import {
  CLIENT_ROUTES,
  DISALLOWED_ROUTES,
  IPage,
  ROUTES_REGISTRY,
} from "@repo/core";
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

/**
 * Manages page transitions, routing logic, and navigation state.
 */
export const usePage = () => {
  // Use atomic selectors to prevent unnecessary re-renders
  const setGlobalLoading = useGlobalStore((state) => state.setGlobalLoading);
  const drawerContent = useGlobalStore((state) => state.drawerContent);
  const modalContent = useGlobalStore((state) => state.modalContent);
  const setPage = useGlobalStore((state) => state.setPage);
  const lastPage = useGlobalStore((state) => state.lastPage);
  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);
  const authStatus = useGlobalStore((state) => state.authStatus);
  const accountStatus = useGlobalStore((state) => state.accountStatus);

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
  const isOnDisallowedRoutes = useCallback(
    (path: string) => DISALLOWED_ROUTES.includes(path),
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

  interface NavigateOptions {
    type?: "push" | "replace";
    savePage?: boolean;
    loadPage?: boolean;
    event?: React.MouseEvent;
  }

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

      if (event) event.preventDefault();

      const isCrossZone = crossZoneCheck(page.path);

      // UI Cleanup
      if (drawerContent) closeDrawer();
      if (modalContent) closeModal();
      if (savePage) setLastPage(page);

      // EXTERNAL: Cross-zone or Root dynamic navigation
      if (isCrossZone || page.path === "/") {
        if (loadPage) setGlobalLoading(true);
        window.location.assign(page.path);
        return;
      }

      // INTERNAL: Standard Next.js SPA navigation
      if (loadPage) setGlobalLoading(true);

      if (type === "push") router.push(page.path);
      if (type === "replace") router.replace(page.path);

      // Ensure loading is reset after navigation triggers
      if (loadPage) {
        await delay(2000);
        setGlobalLoading(false);
      }
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
    const isOnAuthRoute = isOnAuth(pathname);
    const isOnOfflineRoute = isOnOffline(pathname);
    const isOnOWebRoute = isOnWeb(pathname);

    // Prevent clearing custom messages if we are just redirecting
    setInlineMsg(null);

    // 1. Determine the path for history tracking
    const pagePath =
      !isOnAuthRoute && !isOnOfflineRoute ? pathname : lastPage.path;

    // 2. Update history only if the path is actually a "trackable" page
    const savedPage = getFromLocalStorage<IPage>();
    setLastPage(
      isOnAuthRoute && savedPage
        ? savedPage
        : { title: extractPageTitle(pagePath), path: pagePath },
    );

    // 3. Access Guard: Logged out users trying to hit restricted internal routes
    const isLoggedOut = authStatus === "UNAUTHENTICATED";
    const isHome = pathname === "/";
    const isInternalRoute =
      !isHome && !isOnAuthRoute && !isOnOWebRoute && !isOnOfflineRoute;

    if (isLoggedOut && isInternalRoute) {
      navigateTo(CLIENT_ROUTES.home, { loadPage: true });
      return; // Exit early to avoid evaluating other guards during redirect
    }

    // 4. Access Guard: Deactivated accounts
    const isDeactivated = accountStatus === "DEACTIVATED";
    const isRestorePath = pathname === CLIENT_ROUTES.restoreAccount.path;

    if (isDeactivated && !isRestorePath) {
      navigateTo(CLIENT_ROUTES.restoreAccount, { loadPage: true });
      return;
    }

    // 5. Access Guard: Prohibited system routes
    if (isOnDisallowedRoutes(pathname)) {
      navigateTo(CLIENT_ROUTES.about, { loadPage: true });
    }
  }, [
    pathname,
    lastPage.path,
    isOnAuth,
    isOnOffline,
    isOnWeb,
    isOnDisallowedRoutes,
    setLastPage,
    setInlineMsg,
    navigateTo,
    authStatus,
    accountStatus,
  ]);

  return {
    setLastPage,
    isOnWeb,
    isOnAuth,
    navigateTo,
    handlePageChange,
    isOnDisallowedRoutes,
    isOnOffline,
  };
};

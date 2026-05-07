"use client";

import { useCallback, useMemo, useState } from "react";
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

  // Tracks the intended destination during a route transition
  const [pendingPath, setPendingPath] = useState<string | null>(null);

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

      setPendingPath(page.path);

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
        setPendingPath(null);
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

  // Synchronous Redirect Detection (The "Anti-Flicker" Guard)
  const { isRedirecting, isNavigating } = useMemo(() => {
    const isLoggedOut = authStatus === "UNAUTHENTICATED";
    const isDeactivated = accountStatus === "DEACTIVATED";
    const isHome = pathname === "/";

    const isOnAuthRoute = isOnAuth(pathname);
    const isOnOWebRoute = isOnWeb(pathname);
    const isOnOfflineRoute = isOnOffline(pathname);

    const isInternalRoute =
      !isHome && !isOnAuthRoute && !isOnOWebRoute && !isOnOfflineRoute;
    const isRestorePath = pathname === CLIENT_ROUTES.restoreAccount.path;

    // 1. Detection for security-based redirects
    const needsAuthRedirect = isLoggedOut && isInternalRoute;
    const needsDeactivationRedirect = isDeactivated && !isRestorePath;
    const redirectActive =
      needsAuthRedirect ||
      needsDeactivationRedirect ||
      isOnDisallowedRoutes(pathname);

    // 2. Detection for standard user-initiated navigation
    const navigatingActive = !!pendingPath && pendingPath !== pathname;

    return {
      isRedirecting: redirectActive,
      isNavigating: navigatingActive,
    };
  }, [
    pathname,
    authStatus,
    accountStatus,
    isOnAuth,
    isOnWeb,
    isOnOffline,
    isOnDisallowedRoutes,
    pendingPath,
  ]);

  /**
   * Synchronizes route change and enforces access control.
   */
  const handlePageChange = useCallback(() => {
    // Reset transient UI states on every navigation
    setInlineMsg(null);
    setPendingPath(null);

    // Security Guard: Execute redirects if isRedirecting is true
    if (isRedirecting) {
      if (authStatus === "UNAUTHENTICATED") {
        navigateTo(CLIENT_ROUTES.home, { loadPage: true });
      } else if (accountStatus === "DEACTIVATED") {
        navigateTo(CLIENT_ROUTES.restoreAccount, { loadPage: true });
      } else if (isOnDisallowedRoutes(pathname)) {
        navigateTo(CLIENT_ROUTES.about, { loadPage: true });
      }
      return; // Exit to prevent history tracking during redirect
    }

    // History Tracking: Only track valid internal pages
    const isOnAuthRoute = isOnAuth(pathname);
    const isOnOfflineRoute = isOnOffline(pathname);

    // Fallback to last valid page if currently on an auth/offline utility page
    const pagePath =
      !isOnAuthRoute && !isOnOfflineRoute ? pathname : lastPage.path;
    const savedPage = getFromLocalStorage<IPage>();

    // Update the lastPage state for breadcrumbs or "back" logic
    setLastPage(
      isOnAuthRoute && savedPage
        ? savedPage
        : { title: extractPageTitle(pagePath), path: pagePath },
    );
  }, [
    isRedirecting,
    pathname,
    authStatus,
    accountStatus,
    lastPage.path,
    setLastPage,
    setInlineMsg,
    navigateTo,
    extractPageTitle,
    isOnAuth,
    isOnOffline,
    isOnDisallowedRoutes,
  ]);

  return {
    setLastPage,
    isOnWeb,
    isOnAuth,
    navigateTo,
    handlePageChange,
    isRedirecting,
    isOnDisallowedRoutes,
    isOnOffline,
    isNavigating,
  };
};

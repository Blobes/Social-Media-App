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
  // Use atomic selectors to prevent unnecessary re-renders
  const setGlobalLoading = useGlobalStore((state) => state.setGlobalLoading);
  const drawerContent = useGlobalStore((state) => state.drawerContent);
  const modalContent = useGlobalStore((state) => state.modalContent);
  const setPage = useGlobalStore((state) => state.setPage);
  const lastPage = useGlobalStore((state) => state.lastPage);
  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);
  const authStatus = useGlobalStore((state) => state.authStatus);
  const accountStatus = useGlobalStore((state) => state.accountStatus);
  const authUser = useGlobalStore((state) => state.authUser);

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

  const isCurrentRoute = pathname === pendingPath;
  const isAuthRoute = isOnAuth(pathname);
  const isOfflineRoute = isOnOffline(pathname);
  const isExternalRoute = isOnExternal(pathname);
  const isInternalRoute = !isCurrentRoute && !isExternalRoute;

  // Synchronous Defensive Guards & Redirect Logic
  const guards = useMemo(() => {
    // Direct Security Violations
    const needsLogin = authStatus === "UNAUTHENTICATED" && isInternalRoute;

    const needsOtpVerification =
      (accountStatus === "NOT_VERIFIED" ||
        (authUser && !authUser.isEmailVerified && !authUser.isPhoneVerified)) &&
      isInternalRoute;

    const needsOnboarding =
      authStatus === "AUTHENTICATED" &&
      (accountStatus === "NOT_ONBOARDED" ||
        (authUser && !authUser.isOnboarded)) &&
      isInternalRoute;

    const needsRestoreAccount =
      authStatus === "AUTHENTICATED" &&
      accountStatus === "DEACTIVATED" &&
      isInternalRoute;

    const isDisallowed = isOnDisallowed(pathname);

    // Navigation State
    const isNavigating = !!pendingPath && pendingPath !== pathname;
    const isRedirecting =
      needsLogin ||
      needsOtpVerification ||
      needsOnboarding ||
      needsRestoreAccount ||
      isDisallowed;

    return {
      needsLogin,
      needsOnboarding,
      needsRestoreAccount,
      needsOtpVerification,
      isNavigating,
      isRedirecting,
    };
  }, [
    pathname,
    authStatus,
    accountStatus,
    authUser,
    pendingPath,
    isOnAuth,
    isOnWeb,
    isOnOffline,
    isOnDisallowed,
  ]);

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
    // Reset transient UI states on every navigation
    setInlineMsg(null);
    setPendingPath(null);
    setGlobalLoading(false);

    // Security Guard: Execute redirects if isRedirecting is true
    if (guards.isRedirecting) {
      if (guards.needsLogin) navigateTo(CLIENT_ROUTES.home, { loadPage: true });
      if (guards.needsOtpVerification)
        navigateTo(CLIENT_ROUTES.verifyOtp, { loadPage: true });
      else if (guards.needsOnboarding)
        navigateTo(CLIENT_ROUTES.onboarding, { loadPage: true });
      else if (guards.needsRestoreAccount)
        navigateTo(CLIENT_ROUTES.restoreAccount, { loadPage: true });
      else if (isOnDisallowed(pathname))
        navigateTo(CLIENT_ROUTES.about, { loadPage: true });
      return;
    }

    // Fallback to last valid page if currently on an auth/offline utility page
    const pagePath =
      guards.isRedirecting || (!isAuthRoute && !isOfflineRoute)
        ? pathname
        : lastPage.path;
    const savedPage = getFromLocalStorage<IPage>();
    // Update the lastPage state for breadcrumbs or "back" logic
    setLastPage(
      savedPage ?? { title: extractPageTitle(pagePath), path: pagePath },
    );
  }, [
    guards,
    pathname,
    lastPage.path,
    setLastPage,
    setInlineMsg,
    navigateTo,
    extractPageTitle,
    isOnAuth,
    isOnOffline,
    isOnDisallowed,
  ]);

  return {
    setLastPage,
    isOnWeb,
    navigateTo,
    handlePageChange,
    ...guards,
  };
};

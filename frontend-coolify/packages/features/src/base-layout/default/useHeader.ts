"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { dragToCloseConfig } from "@repo/helpers";
import { CLIENT_ROUTES, MenuRef } from "@repo/core";
import {
  useDragClose,
  useGlobalStore,
  useMisc,
  usePage,
  usePageScroll,
} from "@repo/shared-hooks";

/** * Parameters for handling avatar interactions on different screen sizes.
 */
interface AvatarParams {
  desktop: React.MouseEvent<HTMLElement>;
  mobile: { header: React.ReactNode; content: React.ReactNode };
}

/** * Manages logic for the application header, including navigation,
 * scroll direction tracking, and responsive menu behavior.
 */
export const useHeader = (scrollRef?: React.RefObject<HTMLElement | null>) => {
  // Selecting specific state from Zustand store
  const authStatus = useGlobalStore((state) => state.authStatus);
  const authUser = useGlobalStore((state) => state.authUser);

  const { openDrawer, closeDrawer, isDesktop, handleWindowResize } = useMisc();
  const { setLastPage, navigateTo } = usePage();
  const { handlePageScroll } = usePageScroll();

  const theme = useTheme();
  const router = useRouter();
  const menuRef = useRef<MenuRef>(null);

  const scrollDir = handlePageScroll(scrollRef);
  const isLoggedIn = authStatus === "AUTHENTICATED";

  /** * Syncs window resize events with the shared state.
   */
  useEffect(() => {
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [handleWindowResize]);

  /** * Redirects to the notification center.
   */
  const handleNotification = (e: React.MouseEvent) => {
    e.preventDefault();
    setLastPage(CLIENT_ROUTES.notifications);
    router.push(CLIENT_ROUTES.notifications.path);
  };

  /** * Returns user to the home dashboard.
   */
  const handleLogo = () => {
    navigateTo(CLIENT_ROUTES.home);
  };

  /** * Triggers the appropriate menu based on device type.
   */
  const handleAvatar = (element: AvatarParams) => {
    if (isDesktop) {
      menuRef.current?.openMenu(element.desktop.currentTarget);
    } else {
      openMobileNav(element);
    }
  };

  /** * Configures and opens the mobile navigation drawer.
   */
  const openMobileNav = useCallback(
    (element: AvatarParams) => {
      openDrawer({
        ...element.mobile,
        source: "navbar",
        onClose: closeDrawer,
        useDragConfig: () => useDragClose(dragToCloseConfig()),
        style: {
          base: {
            overlay: { padding: theme.boxSpacing(6), display: "none" },
            content: { height: "100%", borderRadius: "0px" },
          },
          smallScreen: {
            overlay: { padding: theme.boxSpacing(0), display: "flex" },
          },
          header: {
            justifyContent: "space-between",
            padding: theme.boxSpacing(5, 8),
          },
        },
      });
    },
    [openDrawer, closeDrawer, theme],
  );

  return {
    isLoggedIn,
    isDesktop,
    scrollDir,
    authStatus,
    menuRef,
    handleNotification,
    handleLogo,
    handleAvatar,
    openMobileNav,
    navigateTo,
    authUser,
  };
};

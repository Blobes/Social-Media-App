"use client";

import { useRef, useEffect, useCallback } from "react";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { useMisc } from "./useMisc";
import { usePage } from "./usePage";
import { usePageScroll } from "./usePageScroll";
import { useDragClose } from "./useDrag";
import { CLIENT_ROUTES, MenuRef } from "@repo/core";
import { dragToCloseConfig } from "@repo/helpers";
import { useGlobalStore } from "./store/useGlobalStore";

/**
 * Manages Header logic, navigation, and mobile drawer interactions.
 */
export const useHeader = (scrollRef?: React.RefObject<HTMLElement | null>) => {
  // Atomic selectors prevent re-renders when unrelated store parts change
  const authUser = useGlobalStore((state) => state.authUser);
  const authStatus = useGlobalStore((state) => state.authStatus);

  const { openDrawer, closeDrawer, isDesktop, handleWindowResize } = useMisc();
  const { setLastPage, navigateTo } = usePage();
  const { handlePageScroll } = usePageScroll();
  const theme = useTheme();
  const router = useRouter();

  const menuRef = useRef<MenuRef>(null);
  const scrollDir = handlePageScroll(scrollRef);
  const isLoggedIn = authStatus === "AUTHENTICATED";

  useEffect(() => {
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [handleWindowResize]);

  const handleNotification = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setLastPage(CLIENT_ROUTES.notifications);
      router.push(CLIENT_ROUTES.notifications.path);
    },
    [router, setLastPage],
  );

  const handleLogo = useCallback(() => {
    navigateTo(CLIENT_ROUTES.home);
  }, [navigateTo]);

  interface AvartarParams {
    desktop: React.MouseEvent<HTMLElement>;
    mobile: { header: React.ReactNode; content: React.ReactNode };
  }

  const openMobileNav = useCallback(
    (element: AvartarParams) => {
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

  const handleAvatar = useCallback(
    (element: AvartarParams) => {
      if (isDesktop) {
        menuRef.current?.openMenu(element.desktop.currentTarget);
      } else {
        openMobileNav(element);
      }
    },
    [isDesktop, openMobileNav],
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

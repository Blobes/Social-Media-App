"use client";

import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { delay, checkSignal } from "@repo/helpers";
import { DrawerProps, ModalProps } from "@repo/core";
import { useGlobalStore } from "./store/useGlobalStore";
import { useCallback } from "react";

/**
 * Provides shared UI utilities including drawer/modal management and network status.
 */
export const useMisc = () => {
  const theme = useTheme();

  // Extracting specific state and actions from the Zustand store to minimize re-renders
  const setDrawerContent = useGlobalStore((state) => state.setDrawerContent);
  const drawerContent = useGlobalStore((state) => state.drawerContent);
  const setModalContent = useGlobalStore((state) => state.setModalContent);
  const networkStatus = useGlobalStore((state) => state.networkStatus);
  const setNetworkStatus = useGlobalStore((state) => state.setNetworkStatus);
  const setSignalCheck = useGlobalStore((state) => state.setSignalCheck);

  // Responsive breakpoints
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Network state flags
  const isOnline = networkStatus === "STABLE";
  const isUnstableNetwork = networkStatus === "UNSTABLE";
  const isOffline = networkStatus === "OFFLINE";

  /**
   * Opens the global drawer with the provided configuration.
   */
  const openDrawer = useCallback(
    (update: DrawerProps) => {
      setDrawerContent(update);
    },
    [setDrawerContent],
  );

  /**
   * Closes the global drawer with a slight delay for smooth exit animations.
   */
  const closeDrawer = useCallback(async () => {
    await delay(200);
    setDrawerContent(null);
  }, [setDrawerContent]);

  /**
   * Opens the global modal with the provided configuration.
   */
  const openModal = useCallback(
    (update: ModalProps) => {
      setModalContent(update);
    },
    [setModalContent],
  );

  /**
   * Closes the global modal with a slight delay for smooth exit animations.
   */
  const closeModal = useCallback(async () => {
    await delay(200);
    setModalContent(null);
  }, [setModalContent]);

  /**
   * Automatically closes the navbar drawer when transitioning to desktop view.
   */
  const handleWindowResize = useCallback(() => {
    if (isDesktop && drawerContent?.source === "navbar") {
      closeDrawer();
    }
  }, [isDesktop, drawerContent?.source, closeDrawer]);

  /**
   * Triggers a manual network signal check and updates global status.
   */
  const verifySignal = useCallback(async () => {
    setSignalCheck(true);
    const status = await checkSignal();
    setNetworkStatus(status);
    await delay(300);
    setSignalCheck(false);
  }, [setSignalCheck, setNetworkStatus]);

  return {
    openDrawer,
    closeDrawer,
    openModal,
    closeModal,
    isDesktop,
    isMobile,
    handleWindowResize,
    verifySignal,
    isOnline,
    isUnstableNetwork,
    isOffline,
  };
};

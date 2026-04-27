"use client";

import React, { useEffect, useCallback } from "react";
import { WifiOff } from "lucide-react";
import { useSnackbar } from "./useSnackbar";
import { useOffline } from "./useOffline";
import { usePage } from "./usePage";
import { removeFromLocalStorage, saveToLocalStorage } from "@repo/helpers";
import { AuthStatus, CLIENT_ROUTES } from "@repo/core";
import { useGlobalStore } from "./store/useGlobalStore";

/**
 * Manages global window event listeners for network, lifecycle, and transitions.
 */
export const useEventListener = (verifyAuth: () => Promise<void>) => {
  const { setSBMessage, removeSBMessage } = useSnackbar();
  const setNetworkStatus = useGlobalStore((state) => state.setNetworkStatus);
  const setGlobalLoading = useGlobalStore((state) => state.setGlobalLoading);
  const authStatus = useGlobalStore((state) => state.authStatus);

  const { switchToOnlineMode } = useOffline();
  const { navigateTo } = usePage();

  /**
   * Restores online state and verifies session.
   */
  const handleOnline = useCallback(() => {
    console.log("Network: Online");
    removeSBMessage();
    switchToOnlineMode();
    setNetworkStatus("STABLE");
    removeFromLocalStorage("last_auth_status");
    verifyAuth();
  }, [removeSBMessage, switchToOnlineMode, setNetworkStatus, verifyAuth]);

  /**
   * Notifies user of offline status and saves auth intent.
   */
  const handleOffline = useCallback(() => {
    console.log("Network: Offline");
    setSBMessage({
      msg: {
        id: "offline-notification",
        tagline: "No internet connection",
        msgStatus: "INFO",
        behavior: "FIXED",
        hasClose: true,
        cta: {
          label: "Go Offline",
          action: () =>
            navigateTo(CLIENT_ROUTES.offline, {
              type: "push",
              savePage: false,
              loadPage: true,
            }),
        },
        icon: <WifiOff />,
      },
    });
    saveToLocalStorage<AuthStatus>("last_auth_status", authStatus);
  }, [setSBMessage, navigateTo, authStatus]);

  /**
   * Ensures loading states are cleared when navigating back via history.
   */
  const handlePageTransition = useCallback(
    (event: PageTransitionEvent) => {
      if (event.persisted) {
        setGlobalLoading(false);
      }
    },
    [setGlobalLoading],
  );

  /**
   * Effect to manage the lifecycle of window event listeners.
   */
  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("pageshow", handlePageTransition);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("pageshow", handlePageTransition);
    };
  }, [handleOnline, handleOffline, handlePageTransition]);
};

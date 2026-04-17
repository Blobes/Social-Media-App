"use client";

import React, { useEffect, useCallback, useRef } from "react";
import { useSnackbar } from "./useSnackbar";
import { useGlobalContext } from "./useContext";
import { useOffline } from "./useOffline";
import { usePage } from "./usePage";
import { removeFromLocalStorage, saveToLocalStorage } from "@repo/helpers";
import { AuthStatus, CLIENT_ROUTES } from "@repo/core";
import { WifiOff } from "lucide-react";

export const useEventListener = (verifyAuth: () => Promise<void>) => {
  const { setSBMessage, removeSBMessage } = useSnackbar();
  const { setNetworkStatus, setGlobalLoading, authStatus } = useGlobalContext();
  const { switchToOnlineMode } = useOffline();
  const { navigateTo } = usePage();

  const handleOnline = useCallback(() => {
    console.log("Network: Online");
    removeSBMessage();
    switchToOnlineMode();
    setNetworkStatus("STABLE");
    removeFromLocalStorage("last_auth_status");
    verifyAuth();
  }, [removeSBMessage, switchToOnlineMode, setNetworkStatus, verifyAuth]);

  const handleOffline = useCallback(() => {
    console.log("Network: Offline");
    setSBMessage({
      msg: {
        id: Date.now(),
        title: "No internet connection",
        content: "Switch to offline content.",
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
    // setNetworkStatus("OFFLINE");
    saveToLocalStorage<AuthStatus>("last_auth_status", authStatus);
  }, [setSBMessage, navigateTo]);

  // Define handler for user session changes
  const handleAuth = () => {
    if (document.visibilityState === "visible") {
      console.log("Verifying session...");
      verifyAuth();
    }
  };

  const handlePageTransition = (event: PageTransitionEvent) => {
    if (event.persisted) setGlobalLoading(false);
  };

  // Manage listeners internally
  useEffect(() => {
    // verifies user session every 10 minutes
    const interval = setInterval(() => handleAuth(), 1000 * 60 * 10);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("pageshow", handlePageTransition);
    window.addEventListener("visibilitychange", handleAuth);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("pageshow", handlePageTransition);
      window.removeEventListener("visibilitychange", handleAuth);
      // visibilitychange
      clearInterval(interval);
    };
  }, [handleOnline, handleOffline, setGlobalLoading, verifyAuth]); // Re-bind if logic changes
};

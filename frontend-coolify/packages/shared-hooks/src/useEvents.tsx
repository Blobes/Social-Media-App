"use client";

import React, { useEffect, useCallback } from "react";
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

  const online = useCallback(() => {
    console.log("Network: Online");
    removeSBMessage();
    switchToOnlineMode();
    setNetworkStatus("STABLE");
    removeFromLocalStorage("last_auth_status");
    verifyAuth();
  }, [removeSBMessage, switchToOnlineMode, setNetworkStatus, verifyAuth]);

  const offline = useCallback(() => {
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
    saveToLocalStorage<AuthStatus>("last_auth_status", authStatus);
  }, [setSBMessage, navigateTo]);

  // Manage listeners internally
  useEffect(() => {
    const handlePageTransition = (event: PageTransitionEvent) => {
      if (event.persisted) setGlobalLoading(false);
    };

    window.addEventListener("pageshow", handlePageTransition);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);

    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      window.removeEventListener("pageshow", handlePageTransition);
    };
  }, [online, offline, setGlobalLoading]); // Re-bind if logic changes
};

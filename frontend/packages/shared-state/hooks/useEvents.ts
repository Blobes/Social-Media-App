"use client";

import { useEffect, useCallback } from "react";
import { useSnackbar } from "./useSnackbar";
import { clientRoutes } from "@repo/helpers";
import { useGlobalContext } from "../GlobalContext";
import { useOffline } from "./useOffline";
import { usePage } from "./usePage";

export const useEventListener = (verifyAuth: () => Promise<void>) => {
  const { setSBMessage, removeSBMessage } = useSnackbar();
  const { setNetworkStatus, setGlobalLoading } = useGlobalContext();
  const { switchToOnlineMode } = useOffline();
  const { navigateTo } = usePage();

  const online = useCallback(() => {
    console.log("Network: Online");
    removeSBMessage();
    switchToOnlineMode();
    setNetworkStatus("STABLE");
    verifyAuth();
  }, [removeSBMessage, switchToOnlineMode, setNetworkStatus, verifyAuth]);

  const offline = useCallback(() => {
    console.log("Network: Offline");
    setSBMessage({
      msg: {
        id: Date.now(),
        title: "No internet connection",
        content: "Switch to offline content.",
        msgStatus: "ERROR",
        behavior: "FIXED",
        hasClose: true,
        cta: {
          label: "Go Offline",
          action: () =>
            navigateTo(clientRoutes.offline, {
              type: "push",
              savePage: false,
              loadPage: true,
            }),
        },
      },
    });
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

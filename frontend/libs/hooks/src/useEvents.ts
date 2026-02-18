"use client";

import { useRouter } from "next/navigation";
import { useSnackbar } from "./useSnackbar";
import { getCookie, setCookie } from "@funstakes/helpers";
import { sharedRegistry, useGlobalContext } from "@funstakes/shared-state";
import { useOffline } from "./useOffline";

export const useEvent = () => {
  const router = useRouter();
  const { setSBMessage, removeSBMessage } = useSnackbar();
  const { setNetworkStatus } = useGlobalContext();
  const useAuth = sharedRegistry.hooks["useAuth"];
  const { verifyAuth } = useAuth();
  const { switchToOnlineMode } = useOffline();

  const handleBrowserEvents = () => {
    const online = () => {
      removeSBMessage();
      // Switch back to online mode
      switchToOnlineMode();
      setNetworkStatus("STABLE");

      verifyAuth();
    };

    const offline = () => {
      setSBMessage({
        msg: {
          id: 1,
          title: "No internet connection",
          content: "Refresh the page.",
          msgStatus: "ERROR",
          behavior: "FIXED",
          hasClose: true,
          cta: {
            label: "Refresh",
            action: () => router.refresh(),
          },
        },
      });
    };

    const handleVisibility = async () => {
      const recentlyAway = getCookie("recently_away");

      if (document.visibilityState === "visible") {
        if (!recentlyAway) {
          await verifyAuth();
        }
      }
      if (document.visibilityState === "hidden") {
        setCookie("recently_away", "true", 12);
      }
    };

    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  };

  return {
    handleBrowserEvents,
  };
};

"use client";

import { useRouter } from "next/navigation";
import { useSnackbar } from "./useSnackbar";
import { getCookie, setCookie } from "@funstakes/helpers";
import { useGlobalContext } from "@funstakes/shared-state";
import { sharedRegistry } from "@funstakes/helpers";
import { useOffline } from "./useOffline";

export const useEvent = () => {
  const router = useRouter();
  const { setSBMessage, removeSBMessage } = useSnackbar();
  const { setNetworkStatus } = useGlobalContext();
  const { switchToOnlineMode } = useOffline();
  const useAuth = sharedRegistry.hooks["useAuth"];
  const auth = typeof useAuth === "function" ? useAuth() : null;

  const handleBrowserEvents = () => {
    const online = () => {
      removeSBMessage();
      // Switch back to online mode
      switchToOnlineMode();
      setNetworkStatus("STABLE");
      auth?.verifyAuth();
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
          await auth?.verifyAuth();
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

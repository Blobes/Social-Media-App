"use client";

import { useRouter } from "next/navigation";
import { useSnackbar } from "./useSnackbar";
import { clientRoutes, getCookie, setCookie } from "@repo/helpers";
import { useGlobalContext } from "../GlobalContext";
import { useOffline } from "./useOffline";
import { useAuth } from "@repo/auth/shared";
import { usePage } from "./usePage";

export const useEvent = () => {
  const router = useRouter();
  const { setSBMessage, removeSBMessage } = useSnackbar();
  const { setNetworkStatus, setGlobalLoading } = useGlobalContext();
  const { switchToOnlineMode } = useOffline();
  const { verifyAuth } = useAuth();
  const { navigateTo } = usePage();

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

    const handlePageTransition = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setGlobalLoading(false); // Reset if user came back via 'Back' button
      }
      // window.location.reload();
    };

    window.addEventListener("pageshow", handlePageTransition);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pageshow", handlePageTransition);
    };
  };

  return {
    handleBrowserEvents,
  };
};

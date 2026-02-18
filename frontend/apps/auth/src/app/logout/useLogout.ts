"use client";

import { fetcher, clientRoutes, serverApi } from "@funstakes/helpers";
import { useGlobalContext } from "@funstakes/shared-state";
import { usePathname, useRouter } from "next/navigation";
import { useSnackbar, usePage } from "@funstakes/hooks";

export const useLogout = () => {
  const { setAuthUser, setAuthStatus, setSnackBarMsg } = useGlobalContext();
  const { setLastPage } = usePage();
  const { setSBMessage } = useSnackbar();
  const router = useRouter();
  const pathname = usePathname();

  // Logout
  const handleLogout = async () => {
    try {
      //  Send logout request to backend
      await fetcher(serverApi.logout, { method: "POST" });
      setAuthUser(null);
      setAuthStatus("UNAUTHENTICATED");
      if (pathname !== clientRoutes.home.path) {
        setLastPage(clientRoutes.home);
        router.replace(clientRoutes.home.path);
      } else {
        router.refresh();
      }
    } catch (error: any) {
      setSBMessage({
        msg: { content: error.message, msgStatus: "ERROR" },
      });
      console.error("Logout failed:", error);
    }
    //Reset feedback state
    setSnackBarMsg((prev: any) => ({ ...prev, messages: [], inlineMsg: null }));
  };

  return { handleLogout };
};

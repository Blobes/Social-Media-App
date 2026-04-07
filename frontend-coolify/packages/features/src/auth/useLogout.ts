"use client";

import { apiClient, clientRoutes, serverApi } from "@repo/helpers";
import { useGlobalContext, usePage, useSnackbar } from "@repo/shared-state";
import { usePathname, useRouter } from "next/navigation";

export const useLogout = () => {
  const { setAuthUser, setAuthStatus, setSnackBarMsg } = useGlobalContext();
  const { navigateTo } = usePage();
  const { setSBMessage } = useSnackbar();
  const router = useRouter();
  const pathname = usePathname();

  // Logout
  const handleLogout = async () => {
    try {
      //  Send logout request to backend
      await apiClient(serverApi.logout, { method: "POST" });
      setAuthUser(null);
      setAuthStatus("UNAUTHENTICATED");
      if (pathname !== clientRoutes.home.path) {
        navigateTo(clientRoutes.home, {
          loadPage: true,
        });
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

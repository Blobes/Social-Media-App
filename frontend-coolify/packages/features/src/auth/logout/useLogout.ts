"use client";

import { CLIENT_ROUTES, SERVER_API } from "@repo/core";
import { apiClient } from "@repo/helpers";
import {
  useGlobalContext,
  useMisc,
  usePage,
  useSnackbar,
} from "@repo/shared-state";
import { usePathname, useRouter } from "next/navigation";

export const useLogout = () => {
  const { setAuthUser, setAuthStatus } = useGlobalContext();
  const { navigateTo } = usePage();
  const { setSBMessage, clearSBMessages } = useSnackbar();
  const { closeModal } = useMisc();
  const router = useRouter();
  const pathname = usePathname();

  // Logout
  const handleLogout = async () => {
    try {
      //  Send logout request to backend
      await apiClient(SERVER_API.logout, { method: "POST" });
      setAuthUser(null);
      setAuthStatus("UNAUTHENTICATED");
      closeModal();

      if (pathname !== CLIENT_ROUTES.home.path) {
        navigateTo(CLIENT_ROUTES.home, {
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
    clearSBMessages();
  };

  return { handleLogout };
};

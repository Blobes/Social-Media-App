"use client";

import { useGlobalContext, usePage, useSnackbar } from "@repo/shared-state";
import { LoginService } from "./service";
import { CLIENT_ROUTES } from "@repo/core";

export const useAuth = () => {
  const { setAuthUser, setAuthStatus } = useGlobalContext();
  const { setSBMessage } = useSnackbar();
  const { verifyAndFetchUser } = LoginService();
  const { navigateTo } = usePage();

  const verifyAuth = async () => {
    try {
      const res = await verifyAndFetchUser();

      // 1. SUCCESS: User is logged in
      if (res.status === "SUCCESS" && res.payload) {
        setAuthUser(res.payload);
        setAuthStatus("AUTHENTICATED");
        return;
      }

      // 2. UNAUTHORIZED: No session or expired (after refresh attempt)
      if (res.status === "UNAUTHORIZED") {
        setAuthUser(null);
        setAuthStatus("UNAUTHENTICATED");
        return;
      }

      // 3. DEACTIVATED: Handled specifically
      if (res.status === "DEACTIVATED") {
        setAuthUser(res.payload);
        setAuthStatus("DEACTIVATED");
        navigateTo(CLIENT_ROUTES.restoreAccount);
        return;
      }

      // 4. ERROR: Network failure or Server 500
      if (res.status === "ERROR") {
        setAuthUser(null);
        setAuthStatus("ERROR");
        if (res.message) {
          setSBMessage({
            msg: { content: res.message, msgStatus: "ERROR", hasClose: true },
          });
        }
        return;
      }

      // 5. Fallback for safety
      setAuthStatus("UNAUTHENTICATED");

      // // Network Erorr / Offline
      // if (res.status === "ERROR") {
      //   setAuthUser(null);
      //   setAuthStatus("ERROR");
      //   if (res.message)
      //     setSBMessage({
      //       msg: { content: res.message, msgStatus: "ERROR", hasClose: true },
      //     });
      //   return;
      // }

      // // Unauthorized State
      // if (res.status === "UNAUTHORIZED") {
      //   setAuthUser(null);
      //   setAuthStatus("UNAUTHENTICATED");
      //   return;
      // }
    } catch (err: any) {
      // Critical runtime error (e.g. malformed code)
      setAuthUser(null);
      setAuthStatus("ERROR");
      console.error("Critical Auth Hook Failure:", err);
    }
  };

  return { verifyAuth };
};

"use client";

import { verifyAndFetchUser } from "@repo/helpers";
import { useGlobalContext, useSnackbar } from "@repo/shared-state";

export const useAuth = () => {
  const { setAuthUser, setAuthStatus } = useGlobalContext();
  const { setSBMessage } = useSnackbar();

  const verifyAuth = async () => {
    try {
      const res = await verifyAndFetchUser();
      // Success
      if (res.status === "SUCCESS" && res.payload) {
        setAuthUser(res.payload);
        setAuthStatus("AUTHENTICATED");
        return;
      }

      // Network Erorr / Offline
      if (res.status === "ERROR") {
        setAuthUser(null);
        setAuthStatus("ERROR");
        if (res.message)
          setSBMessage({
            msg: { content: res.message, msgStatus: "ERROR", hasClose: true },
          });
        return;
      }

      // Unauthorized State
      if (res.status === "UNAUTHORIZED") {
        setAuthUser(null);
        setAuthStatus("UNAUTHENTICATED");
        return;
      }
    } catch (err: any) {
      // If we reach here, a critical code error occurred
      setAuthUser(null);
      setAuthStatus("ERROR");
      console.log("Bad really bad");
    }
  };

  return { verifyAuth };
};

"use client";

import { useGlobalContext, usePage, useSnackbar } from "@repo/shared-hooks";
import { LoginService } from "./service";
import { CLIENT_ROUTES } from "@repo/core";
import { useCallback, useRef } from "react";

export const useAuth = () => {
  const { setAuthUser, setAuthStatus } = useGlobalContext();
  const { setSBMessage } = useSnackbar();
  const { verifyAndFetchUser } = LoginService();
  const { navigateTo } = usePage();

  const lastChecked = useRef(0);
  const THRESHOLD = 1000 * 60 * 15; // 15 Minutes
  const verifyAuth = useCallback(async () => {
    // Check if we checked recently
    const hasToken = document.cookie
      .split(";")
      .some((item) => item.trim().startsWith("is_logged_in="));

    const now = Date.now();
    if (now - lastChecked.current < THRESHOLD && hasToken) {
      console.log("Skipping session verification: Checked recently.");
      return;
    }
    // Update the timestamp before verifying
    lastChecked.current = now;

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
    } catch (err: any) {
      // Critical runtime error (e.g. malformed code)
      lastChecked.current = 0; // Reset on error so we can retry immediately
      setAuthUser(null);
      setAuthStatus("ERROR");
      console.error("Critical Auth Hook Failure:", err);
    }
  }, [verifyAndFetchUser, setAuthUser, setAuthStatus, navigateTo]);

  return { verifyAuth };
};

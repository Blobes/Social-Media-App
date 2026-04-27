"use client";

import { usePage, useSnackbar, useGlobalStore } from "@repo/shared-hooks";
import { LoginService } from "./service";
import { CLIENT_ROUTES, QUERY_KEYS } from "@repo/core";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

/**
 * Manages user authentication state and session verification.
 * Automatically pings the server every 10 minutes or on window focus.
 */
export const useAuth = () => {
  /**
   * Performance: Using individual selectors
   */
  const setAuthUser = useGlobalStore((state) => state.setAuthUser);
  const setAuthStatus = useGlobalStore((state) => state.setAuthStatus);

  const { setSBMessage } = useSnackbar();
  const { verifyAndFetchUser } = LoginService();
  const { navigateTo } = usePage();

  const { refetch, isFetching } = useQuery({
    queryKey: [QUERY_KEYS.USER.SESSION],
    queryFn: async () => {
      // Checking for the hint cookie before making a network request
      const hasToken = document.cookie
        .split(";")
        .some((item) => item.trim().startsWith("is_logged_in="));

      if (hasToken) return;

      try {
        const res = await verifyAndFetchUser();

        // SUCCESS: User session is valid
        if (res.status === "SUCCESS" && res.payload) {
          setAuthUser(res.payload);
          setAuthStatus("AUTHENTICATED");
          return res.payload;
        }

        // UNAUTHORIZED: Session expired or invalid
        if (res.status === "UNAUTHORIZED") {
          setAuthUser(null);
          setAuthStatus("UNAUTHENTICATED");
          return null;
        }

        // DEACTIVATED: User exists but account is locked
        if (res.status === "DEACTIVATED") {
          setAuthUser(res.payload);
          setAuthStatus("DEACTIVATED");
          navigateTo(CLIENT_ROUTES.restoreAccount);
          return res.payload;
        }

        // ERROR: Network or server failure
        if (res.status === "ERROR") {
          setAuthUser(null);
          setAuthStatus("ERROR");
          if (res.message) {
            setSBMessage({
              msg: { tagline: res.message, msgStatus: "ERROR", hasClose: true },
            });
          }
          return null;
        }

        setAuthStatus("UNAUTHENTICATED");
        return null;
      } catch (err) {
        setAuthUser(null);
        setAuthStatus("ERROR");
        console.error("Critical Auth Hook Failure:", err);
        throw err;
      }
    },
    // REPLACES manual visibilitychange listener
    refetchOnWindowFocus: true,
    // REPLACES manual 10-minute setInterval
    refetchInterval: 1000 * 60 * 10,
    // Set to true if you want it to run automatically on mount
    enabled: true,
  });

  const verifyAuth = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    verifyAuth,
    isVerifying: isFetching,
  };
};

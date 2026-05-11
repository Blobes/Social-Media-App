"use client";

import { usePage, useSnackbar, useGlobalStore } from "@repo/shared-hooks";
import { SharedLoginService } from "./service";
import { CLIENT_ROUTES, CACHE_KEYS } from "@repo/core";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAuthNavigation } from "./useAuthNavigation";

/**
 * Manages user authentication state and session verification.
 * Automatically pings the server every 10 minutes or on window focus.
 */
export const useAuthVerification = () => {
  const setAuthUser = useGlobalStore((state) => state.setAuthUser);
  const setAuthStatus = useGlobalStore((state) => state.setAuthStatus);
  const setAccountStatus = useGlobalStore((state) => state.setAccountStatus);

  const { setSBMessage } = useSnackbar();
  const { verifyAndFetchUser } = SharedLoginService();
  const { navigateTo } = usePage();

  const { refetch, isFetching } = useQuery({
    queryKey: [CACHE_KEYS.USER.SESSION],
    queryFn: async () => {
      try {
        const res = await verifyAndFetchUser();
        const user = res.payload;
        // SUCCESS: User session is valid
        if (res.status === "SUCCESS" && user) {
          setAuthUser(user);
          setAuthStatus("AUTHENTICATED");

          // NOT ONBOARDED: User exists but is not on boarded
          if (!user.isOnboarded) {
            setAccountStatus("NOT_ONBOARDED");
            navigateTo(CLIENT_ROUTES.onboarding, { loadPage: true });
          }

          // DEACTIVATED: User exists but account is locked
          if (user.accountStatus === "DEACTIVATED") {
            setAuthUser(user);
            setAccountStatus("DEACTIVATED");
            navigateTo(CLIENT_ROUTES.restoreAccount);
          }
          return user;
        }

        // UNAUTHORIZED: Session expired or invalid
        if (res.status === "UNAUTHORIZED") {
          setAuthUser(null);
          setAuthStatus("UNAUTHENTICATED");
          return null;
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

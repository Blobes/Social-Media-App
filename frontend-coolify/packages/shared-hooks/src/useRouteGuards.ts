"use client";

import { useMemo } from "react";
import {
  CLIENT_ROUTES,
  DISALLOWED_ROUTES,
  ROUTES_REGISTRY,
  useGlobalStore,
} from "@repo/core";

export const REDIRECT_MAP = [
  { guard: "needsLogin", target: CLIENT_ROUTES.home },
  { guard: "needsOtpVerification", target: CLIENT_ROUTES.verifyOtp },
  { guard: "needsOnboarding", target: CLIENT_ROUTES.onboarding },
  { guard: "needsRestoreAccount", target: CLIENT_ROUTES.restoreAccount },
  { guard: "isOnDisallowedRoute", target: CLIENT_ROUTES.about },
] as const;

export const useRouteGuards = (
  pathname: string,
  pendingPath: string | null,
) => {
  const authStatus = useGlobalStore((state) => state.authStatus);
  const accountStatus = useGlobalStore((state) => state.accountStatus);
  const authUser = useGlobalStore((state) => state.authUser);

  return useMemo(() => {
    const isCurrentRoute = pathname === pendingPath;
    const isExternalRoute = ROUTES_REGISTRY.external.includes(pathname);
    const isInternalRoute = !isCurrentRoute && !isExternalRoute;
    const isOnDisallowedRoute = DISALLOWED_ROUTES.includes(pathname);

    const needsLogin =
      authStatus === "UNAUTHENTICATED" &&
      isInternalRoute &&
      pathname !== CLIENT_ROUTES.home.path;

    const needsOtpVerification =
      authStatus === "AUTHENTICATED" &&
      (accountStatus === "NOT_VERIFIED" ||
        (authUser &&
          (!authUser.isEmailVerified || !authUser.isPhoneVerified))) &&
      isInternalRoute &&
      pathname !== CLIENT_ROUTES.verifyOtp.path;

    const needsOnboarding =
      authStatus === "AUTHENTICATED" &&
      !needsOtpVerification &&
      (accountStatus === "NOT_ONBOARDED" ||
        (authUser && !authUser.isOnboarded)) &&
      isInternalRoute &&
      pathname !== CLIENT_ROUTES.onboarding.path &&
      pathname !== CLIENT_ROUTES.verifyOtp.path;

    const needsRestoreAccount =
      !needsLogin &&
      accountStatus === "DEACTIVATED" &&
      isInternalRoute &&
      pathname !== CLIENT_ROUTES.restoreAccount.path;

    return {
      needsLogin,
      needsOtpVerification,
      needsOnboarding,
      needsRestoreAccount,
      isOnDisallowedRoute,
      isNavigating: !!pendingPath && pendingPath !== pathname,
      isRedirecting:
        needsLogin ||
        needsOtpVerification ||
        needsOnboarding ||
        needsRestoreAccount ||
        isOnDisallowedRoute,
    };
  }, [pathname, authStatus, accountStatus, authUser, pendingPath]);
};

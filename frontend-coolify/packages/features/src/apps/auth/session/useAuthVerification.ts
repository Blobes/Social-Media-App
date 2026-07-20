"use client";

import { useSnackbar, useStaticTranslation } from "@repo/shared-hooks";
import { AuthService } from "./service";
import {
  CACHE_KEYS,
  useGlobalStore,
  ApiError,
  IUser,
  AUTH_FEEDBACK,
} from "@repo/core";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { getCookie } from "@repo/helpers";

/**
 * Manages user authentication state and session verification.
 */
export const useAuthVerification = () => {
  const setAuthUser = useGlobalStore((state) => state.setAuthUser);
  const setAuthStatus = useGlobalStore((state) => state.setAuthStatus);
  const setAccountStatus = useGlobalStore((state) => state.setAccountStatus);
  const setAccessToken = useGlobalStore((state) => state.setAccessToken);
  const { translateTxtString } = useStaticTranslation();
  const { setSBMessage } = useSnackbar();
  const { verifyAndFetchUser } = AuthService();

  const { refetch, isFetching } = useQuery<IUser | null, ApiError>({
    queryKey: [CACHE_KEYS.USER.SESSION],
    queryFn: async () => {
      try {
        const res = await verifyAndFetchUser();
        const user = res.payload;

        if (user) {
          setAuthUser(user);
          setAuthStatus("AUTHENTICATED");
          setAccessToken(res.accessToken || null);

          if (!user.isEmailVerified && !user.isPhoneVerified) {
            setAccountStatus("NOT_VERIFIED");
          }

          if (!user.isOnboarded) {
            setAccountStatus("NOT_ONBOARDED");
          }

          if (user.accountStatus === "DEACTIVATED") {
            setAccountStatus("DEACTIVATED");
          }
          return user;
        }

        setAuthUser(null);
        setAuthStatus("UNAUTHENTICATED");
        return null;
      } catch (err: any) {
        const error = err as ApiError;
        setAuthUser(null);

        if (
          error.httpStatus === 401 ||
          error.httpStatus === 403 ||
          error.status === "UNAUTHORIZED"
        ) {
          setAuthStatus("UNAUTHENTICATED");
          // setSBMessage({
          //   msg: {
          //     tagline:
          //       error.localizedErrMsg ||
          //       translateTxtString(AUTH_FEEDBACK.session_expired) ||
          //       error.message,
          //     msgStatus: "ERROR",
          //     hasClose: true,
          //   },
          // });
        } else {
          setAuthStatus("ERROR");
          const errorMsg =
            error.localizedErrMsg ||
            error.message ||
            translateTxtString(AUTH_FEEDBACK.server_error);
          setSBMessage({
            msg: { tagline: errorMsg, msgStatus: "ERROR", hasClose: true },
          });
        }
        console.error("Critical Auth Hook Failure:", error);
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60 * 10,
  });

  const verifyAuth = useCallback(async () => {
    const resetPassSession = getCookie("reset_session_expiry");
    if (resetPassSession) return;

    await refetch();
  }, [refetch]);

  return {
    verifyAuth,
    isVerifying: isFetching,
  };
};

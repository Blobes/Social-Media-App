"use client";

import { useSnackbar } from "@repo/shared-hooks";
import { AuthService } from "./service";
import { CACHE_KEYS, useGlobalStore } from "@repo/core";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

/\*\*

- Manages user authentication state and session verification.
- Automatically pings the server every 10 minutes or on window focus.
  \*/
  export const useAuthVerification = () => {
  const setAuthUser = useGlobalStore((state) => state.setAuthUser);
  const setAuthStatus = useGlobalStore((state) => state.setAuthStatus);
  const setAccountStatus = useGlobalStore((state) => state.setAccountStatus);
  const setAccessToken = useGlobalStore((state) => state.setAccessToken);

const { setSBMessage } = useSnackbar();
const { verifyAndFetchUser } = AuthService();

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
setAccessToken(res.accessToken || null);

          // NOT VERIFIED: User exists but is needs email/phone otp verification
          if (!user.isEmailVerified && !user.isPhoneVerified) {
            setAccountStatus("NOT_VERIFIED");
          }

          // NOT ONBOARDED: User exists but is not on boarded
          if (!user.isOnboarded) {
            setAccountStatus("NOT_ONBOARDED");
          }

          // DEACTIVATED: User exists but account is locked
          if (user.accountStatus === "DEACTIVATED") {
            // setAuthUser(user);
            setAccountStatus("DEACTIVATED");
            // navigateTo(CLIENT_ROUTES.restoreAccount);
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

"use client";

import { apiClient, checkNetworkError } from "@repo/helpers";
import {
IUser,
SERVER_API,
ISinglePayload,
FetchStatus,
ApiError,
} from "@repo/core";

interface RefreshRes {
isRefreshed?: boolean;
accessToken?: string | null;
}

export const AuthService = () => {
// Use ISinglePayload with IUser as the generic type
const verifyAndFetchUser = async (): Promise<
ISinglePayload<IUser> & RefreshRes

> => {

    try {
      // If there is NO token, they are definitely unauthenticated.
      // We return early to avoid unnecessary API calls.
      const hasToken = document.cookie
        .split(";")
        .some((item) => item.trim().startsWith("is_logged_in="));
      if (!hasToken) {
        const error = new Error("You are not logged in") as ApiError;
        error.httpStatus = 401;
        error.status = "UNAUTHORIZED";
        error.payload = null;
        throw error;
      }

      const res = await apiClient<ISinglePayload<IUser>>(
        SERVER_API.verifyUserSession,
      );

      if (res.status === "SUCCESS") {
        return {
          payload: res.payload,
          status: "SUCCESS",
          message: res.localizedSuccessMsg || res.message,
          httpStatus: res.httpStatus,
        };
      }

      return {
        payload: null,
        status: res.status || "ERROR",
        message: res.message || "Auth verification failed",
      };
    } catch (err: any) {
      const apiErr = err as ApiError;
      // Check for Unauthorized using both custom status string and numeric code
      const isAuthIssue =
        err.status === ("UNAUTHORIZED" as FetchStatus) ||
        err.httpStatus === 401 ||
        err.httpStatus === 403;

      if (isAuthIssue) {
        const refreshed = await refreshAccessToken();
        if (refreshed.isRefreshed) {
          try {
            // Retry the call
            const retryRes = await apiClient<
              ISinglePayload<IUser> & RefreshRes
            >(SERVER_API.verifyUserSession);
            return {
              payload: retryRes.payload,
              accessToken: refreshed.accessToken,
              status: "SUCCESS",
              message: "Session restored via refresh",
            };
          } catch (retryErr) {
            return {
              payload: null,
              status: "UNAUTHORIZED",
              message: "Re-authentication failed",
            };
          }
        }
        return {
          payload: null,
          status: "UNAUTHORIZED",
          message: "Session expired",
          httpStatus: 401,
        };
      }

      // Fallback to network error check
      const networkError = checkNetworkError(apiErr);
      if (networkError) return networkError as ISinglePayload<IUser>;

      return {
        payload: null,
        status: apiErr.status || "ERROR",
        message: apiErr.message || "An unexpected error occurred",
        httpStatus: apiErr.httpStatus,
      };
    }

};

const refreshAccessToken = async (): Promise<RefreshRes> => {
try {
// Typing the refresh call as well
const res = await apiClient<ISinglePayload<RefreshRes>>(
SERVER_API.refreshToken,
{
method: "POST",
},
);
return {
isRefreshed: res.status === "SUCCESS",
accessToken: res.payload?.accessToken,
};
} catch (err: any) {
const apiErr = err as ApiError;
const isExpired =
apiErr.httpStatus === 401 ||
apiErr.httpStatus === 400 ||
apiErr.status === "UNAUTHORIZED";

      if (isExpired) return { isRefreshed: false };

      console.error("Auth Refresh Failed unexpectedly:", apiErr.message);
      return { isRefreshed: false };
    }

};

return { verifyAndFetchUser };
};

"use client";

import { apiClient } from "@repo/helpers";
import {
  IUser,
  SERVER_API,
  ISinglePayload,
  ApiError,
  AUTH_FEEDBACK,
} from "@repo/core";

interface RefreshRes {
  accessToken?: string | null;
}

export const AuthSharedService = () => {
  /**
   * Verifies the active user session and automatically performs an access token refresh if expired.
   */
  const verifyAndFetchUser = async (): Promise<
    ISinglePayload<IUser> & RefreshRes
  > => {
    try {
      return await apiClient<ISinglePayload<IUser>>(
        SERVER_API.verifyUserSession,
      );
    } catch (err: any) {
      const apiErr = err as ApiError;
      const isAuthIssue =
        apiErr.httpStatus === 401 ||
        apiErr.httpStatus === 403 ||
        apiErr.status === "UNAUTHORIZED";

      console.log("Network request hit auth issue block");

      if (isAuthIssue) {
        const refreshedToken = await refreshAccessToken();
        if (refreshedToken) {
          console.log(
            "Token refresh succeeded, retrying verification api call",
          );
          try {
            const retryRes = await apiClient<ISinglePayload<IUser>>(
              SERVER_API.verifyUserSession,
            );
            return {
              ...retryRes,
              accessToken: refreshedToken,
            };
          } catch (retryErr: any) {
            console.log("Retry verification API call failed after refresh");
            throw retryErr;
          }
        }

        console.log("Handshake token allocation failed completely");
        const authExpiredError = new Error(
          apiErr.message || AUTH_FEEDBACK.session_expired.tValue,
        ) as ApiError;
        authExpiredError.httpStatus = 401;
        authExpiredError.status = "UNAUTHORIZED";
        authExpiredError.payload = null;
        authExpiredError.localizedErrMsg = apiErr.localizedErrMsg;
        throw authExpiredError;
      }
      console.log("Bypassing auth handling, throwing generic error");
      throw apiErr;
    }
  };

  /**
   * Silently issues a re-authentication handshake token mutation cycle. Returns string or null.
   */
  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const res = await apiClient<ISinglePayload<RefreshRes>>(
        SERVER_API.refreshToken,
        { method: "POST" },
      );
      return res.payload?.accessToken || null;
    } catch (err: any) {
      console.error("Auth Refresh Failed:", err.message);
      return null;
    }
  };

  return { verifyAndFetchUser };
};

"use client";

import { apiClient, checkNetworkError } from "@repo/helpers";
import { IUser, SERVER_API, ISinglePayload, FetchStatus } from "@repo/core";

export const SharedLoginService = () => {
  // Use ISinglePayload with IUser as the generic type
  const verifyAndFetchUser = async (): Promise<ISinglePayload<IUser>> => {
    try {
      const res = await apiClient<ISinglePayload<IUser>>(
        SERVER_API.verifyUserSession,
      );

      if (res.status === "SUCCESS") {
        return {
          payload: res.payload,
          status: "SUCCESS",
          message: res.message,
          httpStatus: res.httpStatus,
        };
      }

      return {
        payload: null,
        status: res.status || "ERROR",
        message: res.message || "Verification failed",
      };
    } catch (err: any) {
      // Check for Unauthorized using both custom status string and numeric code
      const isAuthIssue =
        err.status === ("UNAUTHORIZED" as FetchStatus) ||
        err.httpStatus === 401 ||
        err.httpStatus === 403;

      if (isAuthIssue) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          try {
            // Retry the call
            const retryRes = await apiClient<ISinglePayload<IUser>>(
              SERVER_API.verifyUserSession,
            );
            return {
              payload: retryRes.payload,
              status: "SUCCESS",
              message: "Session restored",
            };
          } catch {
            return { payload: null, status: "ERROR", message: "Retry failed" };
          }
        }
        return {
          payload: null,
          status: "UNAUTHORIZED",
          message: "Session expired",
        };
      }

      // Fallback to network error check
      const networkError = checkNetworkError(err);
      if (networkError) return networkError as ISinglePayload<IUser>;

      return {
        payload: null,
        status: "ERROR",
        message: err.message || "An unexpected error occurred",
        httpStatus: err.httpStatus,
      };
    }
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      // Typing the refresh call as well
      const res = await apiClient<ISinglePayload<any>>(
        SERVER_API.refreshToken,
        {
          method: "POST",
        },
      );
      return res.status === "SUCCESS";
    } catch (err: any) {
      const isExpired =
        err.httpStatus === 401 ||
        err.httpStatus === 400 ||
        err.status === "UNAUTHORIZED";

      if (isExpired) return false;

      console.error("Auth Refresh Failed unexpectedly:", err.message);
      return false;
    }
  };

  return { verifyAndFetchUser };
};

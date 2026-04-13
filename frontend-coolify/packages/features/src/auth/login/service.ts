"use client";

import { apiClient, checkNetworkError } from "@repo/helpers";
import { IUser, SERVER_API } from "@repo/core";

interface TokenCheckResponse {
  payload: IUser | null;
  message?: string;
  status?: "SUCCESS" | "UNAUTHORIZED" | "ERROR";
}

export const LoginService = () => {
  const verifyAndFetchUser = async (): Promise<TokenCheckResponse> => {
    try {
      const res = await apiClient<{ user: IUser }>(SERVER_API.verifyAuthToken);
      return { payload: res.user, status: "SUCCESS" };
    } catch (err: any) {
      const status = typeof err?.status === "number" ? err.status : undefined;

      // Catch 401 (Missing/Expired) OR 403 (Invalid)
      if (status === 401 || status === 403) {
        // Try to refresh once
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          try {
            const retryRes = await apiClient<{ user: IUser }>(
              SERVER_API.verifyAuthToken,
            );
            return { payload: retryRes.user, status: "SUCCESS" };
          } catch {
            return {
              payload: null,
              status: "ERROR",
            };
          }
        }
        return {
          payload: null,
          status: "UNAUTHORIZED",
        };
      }

      // Check if it's a network error (incl. timeout, unknown;
      //  fetcher sets status 0 for these)
      const networkError = checkNetworkError(err);
      if (networkError) return networkError as TokenCheckResponse;

      return {
        payload: null,
        status: "ERROR",
      };
    }
  };

  const refreshAccessToken = async () => {
    try {
      const res = await apiClient(SERVER_API.refreshToken, {
        method: "POST",
      });
      return true;
    } catch (err: any) {
      if (err.status === 401 || err.status === 400) {
        return false;
      }
      console.error("Auth Refresh Failed unexpectedly:", err.message);
      return false;
    }
  };

  return { verifyAndFetchUser };
};

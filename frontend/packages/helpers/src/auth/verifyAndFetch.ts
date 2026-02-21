import { serverApi } from "../routes";
import { fetcher } from "../fetcher";
import { IUser } from "@repo/types";

interface TokenCheckResponse {
  payload: IUser | null;
  message?: string;
  status?: "SUCCESS" | "UNAUTHORIZED" | "ERROR";
}
export const verifyAndFetchUser = async (): Promise<TokenCheckResponse> => {
  try {
    const res = await fetcher<{ user: IUser }>(serverApi.verifyAuthToken);
    return { payload: res.user, status: "SUCCESS" };
  } catch (err: any) {
    const status = typeof err?.status === "number" ? err.status : undefined;

    // Catch 401 (Missing/Expired) OR 403 (Invalid)
    if (status === 401 || status === 403) {
      // Try to refresh once
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        try {
          const retryRes = await fetcher<{ user: IUser }>(
            serverApi.verifyAuthToken,
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
    const res = await fetcher(serverApi.refreshToken, {
      method: "POST",
    });
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

export const checkNetworkError = (err: any) => {
  const status = typeof err?.status === "number" ? err.status : undefined;
  const isNetworkError =
    status === undefined ||
    status === 0 ||
    status >= 500 ||
    err.name === "AbortError" ||
    err.name === "TypeError" ||
    err.message === "Failed to fetch" ||
    err.message === "Connection timed out or failed.";

  if (isNetworkError) {
    return {
      payload: null,
      status: "ERROR",
      message: "Network connection failed",
    };
  }
  return null;
};

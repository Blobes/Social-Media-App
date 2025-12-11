import { IUser } from "../types";

const BASE_URL = "http://localhost:8080";
const DEFAULT_TIMEOUT = 5000; // Default timeout in milliseconds

export const fetcher = async <T>(
  endpoint: string,
  options: RequestInit = {},
  timeout = DEFAULT_TIMEOUT
): Promise<T> => {
  const controller = new AbortController();
  const signal = controller.signal;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: options.method || "GET",
      headers,
      signal,
      credentials: "include", // Needed for cookie-based auth
      ...options,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Something went wrong");
    }
    return await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      console.log(error);
      throw new Error("No internet connection. Please check your network");
    }

    if (error.message === "Failed to fetch" || error instanceof TypeError) {
      throw new Error("Unable to reach the server. Please try again later.");
    }
    throw error;
  }
};

interface TokenCheckResponse {
  payload: IUser | null;
  message?: string;
}

export const fetchUserWithTokenCheck =
  async (): Promise<TokenCheckResponse> => {
    try {
      const res = await fetcher<{ user: IUser }>("/auth/verify", {
        method: "GET",
      });
      return { payload: res.user };
    } catch (err: any) {
      if (err.message?.toLowerCase().includes("invalid token")) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          return fetchUserWithTokenCheck(); // Retry after refreshing token
        }
      }
      return { payload: null, message: err.message };
    }
  };

const refreshAccessToken = async () => {
  try {
    const res = await fetcher("/auth/refresh", {
      method: "POST",
    });
    return true;
  } catch (err) {
    console.error("Failed to refresh token", err);
    return false;
  }
};

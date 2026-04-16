"use client";

import { FetchStatus } from "@repo/core";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_TIMEOUT = 60000; // Default timeout in milliseconds (1 minute)

export const apiClient = async <T>(
  endpoint: string,
  options: RequestInit = {},
  timeout = DEFAULT_TIMEOUT,
): Promise<T> => {
  const controller = new AbortController();
  const signal = options.signal || controller.signal;
  const timeoutId = setTimeout(() => controller.abort("timeout"), timeout);

  try {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      method: options.method || "GET",
      headers,
      signal,
      credentials: "include",
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let message = "Something went wrong";
      let status = "ERROR"; // The custom string (e.g., "UNAUTHORIZED")

      try {
        const errorData = await response.json();
        message = errorData?.message ?? message;
        status = errorData?.status ?? "ERROR";
      } catch {
        message =
          response.statusText || `Request failed with ${response.status}`;
      }

      const error = new Error(message) as any;
      error.httpStatus = response.status; // Always a Number (e.g., 401)
      error.status = status; // Always a String (e.g., "UNAUTHORIZED")
      throw error;
    }

    const data = await response.json();
    return {
      ...data, // This includes your "status": "DEACTIVATED" string
      httpStatus: response.status, // This is the 200 numeric code
    } as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    // AbortError name is standard; when abort("timeout") is used,
    // some envs set message to "timeout" but not name
    const isAbortOrTimeout =
      error?.name === "AbortError" || error?.message === "timeout";
    if (isAbortOrTimeout) {
      const timeoutErr = new Error("Connection timed out or failed.");
      (timeoutErr as any).status = 0;
      throw timeoutErr;
    }
    if (error.message === "Failed to fetch" || error instanceof TypeError) {
      error.status = 0;
      throw error;
    }
    // Ensure every thrown error has a status so callers can branch (e.g. 401 vs network)
    if (typeof (error as any).status !== "number") {
      (error as any).status = 0;
    }
    throw error;
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
      status: "ERROR" as FetchStatus,
      message: "Network connection failed",
    };
  }
  return null;
};

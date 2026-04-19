"use client";

import { FetchStatus } from "@repo/core";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_TIMEOUT = 60000; // Default timeout in milliseconds (1 minute)

/**
 * Standardized fetch wrapper that handles timeouts, base URLs, and error parsing.
 */
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

    // Parse response body once
    let responseData;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json();
    }

    if (!response.ok) {
      // Create a robust error object for TanStack's 'onError' to consume
      const error = new Error(
        responseData?.message || response.statusText || "Request failed",
      ) as any;
      error.httpStatus = response.status;
      error.status = responseData?.status || "ERROR";
      error.payload = responseData || null;
      throw error;
    }

    // Return merged data for successful requests
    return {
      ...responseData,
      httpStatus: response.status,
    } as T;
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Map network or timeout failures to a status 0 for checkNetworkError logic
    if (error.name === "AbortError" || error.message === "timeout") {
      const timeoutErr = new Error("Connection timed out or failed.");
      (timeoutErr as any).httpStatus = 0;
      (timeoutErr as any).status = "TIMEOUT";
      throw timeoutErr;
    }

    if (error.message === "Failed to fetch" || error instanceof TypeError) {
      error.httpStatus = 0;
      error.status = "NETWORK_ERROR";
      throw error;
    }
    throw error;
  }
};

/**
 * Helper to identify if a TanStack error is network-related for UI feedback.
 */
export const checkNetworkError = (err: any) => {
  const httpStatus =
    typeof err?.httpStatus === "number" ? err.httpStatus : undefined;

  const isNetworkError =
    httpStatus === undefined ||
    httpStatus === 0 ||
    httpStatus >= 500 ||
    err.status === "TIMEOUT" ||
    err.status === "NETWORK_ERROR";

  if (isNetworkError) {
    return {
      payload: null,
      status: "ERROR" as FetchStatus,
      message: "Network connection failed",
    };
  }
  return null;
};

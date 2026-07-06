"use client";

import {
  ApiError,
  APITransMsg,
  COMMON_FEEDBACK,
  FetchStatus,
  useGlobalStore,
} from "@repo/core";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_TIMEOUT = 60000; // Default timeout in milliseconds (1 minute)

/**
 * Parses and translates structured feedback contracts sent directly from API nodes.
 */
export const resolveAPIMessage = (
  payload: APITransMsg,
  fallbackKey = "apimessage:auth.server_error",
): string => {
  const storeState = useGlobalStore.getState();
  const I18nInstance = storeState.i18nInstance;
  const currentLanguage = storeState.currentLanguage;

  if (!I18nInstance) return payload?.message || "";

  if (!payload?.i18nKey)
    return (
      payload?.message || I18nInstance.t(fallbackKey, { lng: currentLanguage })
    );
  // Route lookups to the isolated apimessage namespace file explicitly
  const translationKey = payload.i18nKey.includes(":")
    ? payload.i18nKey
    : `apimessage:${payload.i18nKey}`;

  return I18nInstance.t(translationKey, {
    defaultValue: payload.message,
    ...payload.interpolations,
    lng: currentLanguage,
  });
};

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

    // HANDLING LOCALIZATION ON FEEDBACK
    if (responseData) {
      const target = responseData.error || responseData;
      const { i18nKey, interpolations, message } = target;
      if (i18nKey || message) {
        const fallback = response.ok
          ? "apimessage:auth.logged_in_successfully"
          : "apimessage:auth.server_error";
        const localizedString = resolveAPIMessage(
          { i18nKey, interpolations, message },
          fallback,
        );
        responseData.message = localizedString;
        if (responseData.error) responseData.error.message = localizedString;
      }
    }

    // --- ERROR HANDLING ROUTINE ---
    if (!response.ok) {
      // Create a robust error object for TanStack's 'onError' to consume
      const error = new Error(
        responseData?.message || response.statusText || "Request failed",
      ) as ApiError;
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

    if (error.httpStatus !== undefined) throw error;

    const apiErr = new Error(error.message) as ApiError;

    // Map network or timeout failures to a status 0 for checkNetworkError logic
    if (error.name === "AbortError" || error.message === "timeout") {
      apiErr.message = resolveAPIMessage({
        i18nKey: COMMON_FEEDBACK.network_connection_failed.tKey,
        message: COMMON_FEEDBACK.network_connection_failed.tValue,
      });
      apiErr.httpStatus = 0;
      apiErr.status = "TIMEOUT";
      apiErr.payload = null;
    } else if (
      error.message === "Failed to fetch" ||
      error instanceof TypeError
    ) {
      apiErr.message = resolveAPIMessage({
        i18nKey: COMMON_FEEDBACK.server_error.tKey,
        message: COMMON_FEEDBACK.server_error.tValue,
      });
      apiErr.httpStatus = 0;
      apiErr.status = "NETWORK_ERROR";
      apiErr.payload = null;
    } else {
      apiErr.message = resolveAPIMessage({
        i18nKey: COMMON_FEEDBACK.unknown_error.tKey,
        message: error.message,
      });
      apiErr.httpStatus = error.httpStatus || 500;
      apiErr.status = "ERROR";
      apiErr.payload = null;
    }
    throw apiErr;
  }
};

/**
 * Helper to identify if a TanStack error is network-related for UI feedback.
 */
export const checkNetworkError = (err: ApiError) => {
  const isNetworkError =
    err.httpStatus === 0 ||
    err.httpStatus >= 500 ||
    err.status === "TIMEOUT" ||
    err.status === "NETWORK_ERROR";

  if (isNetworkError) {
    return {
      payload: null,
      status: "ERROR" as FetchStatus,
      message: resolveAPIMessage({
        i18nKey: COMMON_FEEDBACK.network_connection_failed.tKey,
        message: COMMON_FEEDBACK.network_connection_failed.tValue,
      }),
    };
  }
  return null;
};

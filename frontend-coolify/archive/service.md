"use client";

import { useCallback } from "react";
import { apiClient } from "@repo/helpers";
import { API_BASE, IListPayload, IPost } from "@repo/core";

/**
 * Service to handle feed-related API interactions.
 */
export const FeedService = () => {
  /**
   * Fetches the unified feed with support for pagination.
   */
  const fetchFeed = useCallback(
    async (
      page: number = 1,
      limit: number = 20,
    ): Promise<IListPayload<IPost>> => {
      try {
        const url = `${API_BASE.feed}?page=${page}&limit=${limit}`;

        const res = await apiClient<IListPayload<IPost>>(url, {
          method: "GET",
        });

        return {
          status: res.status,
          payload: res.payload ?? [],
          message: res.message,
          metaData: res.metaData,
        };
      } catch (error: any) {
        console.error("Feed Service Error:", error);
        return {
          status: error.status || "ERROR",
          payload: null,
          message:
            error.message ?? "Something went wrong while fetching the feed",
        };
      }
    },
    [],
  );

  return {
    fetchFeed,
  };
};

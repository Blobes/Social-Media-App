"use client";

import {
  apiClient,
  queueItem,
  getQueueItem,
  removeQueueItem,
} from "@repo/helpers";
import {
  IGist,
  ISinglePayload,
  IListPayload,
  API_BASE,
  SERVER_API,
} from "@repo/core";
import { useCallback } from "react";

export const GistService = () => {
  /**
   * Fetches a paginated list of gists.
   */
  const fetchGistList = useCallback(
    async (page = 1, limit = 20): Promise<IListPayload<IGist>> => {
      try {
        // Append pagination params to the request URL
        const url = `${API_BASE.gists}?page=${page}&limit=${limit}`;
        const res = await apiClient<IListPayload<IGist>>(url, {
          method: "GET",
        });

        return {
          status: res.status,
          payload: res.payload ?? [],
          message: res.message,
          metaData: res.metaData, // Ensure meta is returned for hasNextPage logic
        };
      } catch (error: any) {
        console.error("Gist Service Error:", error);
        return {
          status: error.status,
          payload: null,
          message: error.message ?? "Something went wrong while fetching gists",
        };
      }
    },
    [],
  );

  interface LikeResponse {
    likedByMe: boolean;
    likeCount: number;
  }
  // Handle like
  const fetchGistLike = useCallback(
    async (gistId: string): Promise<LikeResponse | null> => {
      try {
        const res = await apiClient<ISinglePayload<LikeResponse>>(
          SERVER_API.likeGist(gistId),
          { method: "POST" },
        );
        return res.payload;
      } catch (error) {
        throw error;
      }
    },
    [],
  );

  return {
    fetchGistLike,
    getPendingLike: getQueueItem,
    setPendingLike: queueItem,
    clearPendingLike: removeQueueItem,
    fetchGistList,
  };
};

"use client";

import { apiBase, apiClient } from "@repo/helpers";
import { IListPayload, IPost } from "@repo/core";
import { useCallback } from "react";

export const FeedService = () => {
  const fetchFeed = useCallback(async (): Promise<IListPayload<IPost>> => {
    try {
      const res = await apiClient<IListPayload<IPost>>(apiBase.feed, {
        method: "GET",
      });
      return {
        status: res.status,
        payload: res.payload ?? [],
        message: res.message,
      };
    } catch (error: any) {
      console.error("Feed Service Error:", error);
      return {
        status: error.status,
        payload: null,
        message: error.message ?? "Something went wrong while fetching gists",
      };
    }
  }, []);

  return {
    fetchFeed,
  };
};

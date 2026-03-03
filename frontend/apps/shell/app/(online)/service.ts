"use client";

import { fetcher, serverApi } from "@repo/helpers";
import { IListResponse, IPost, FetchStatus } from "@repo/types";
import { useCallback } from "react";

export interface IFeedResponse {
  status: FetchStatus;
  payload: IPost[] | null;
  message: string;
}

export const useFeedService = () => {
  const fetchFeed = useCallback(async (): Promise<IFeedResponse> => {
    try {
      const res = await fetcher<IListResponse<IPost>>(serverApi.feed, {
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

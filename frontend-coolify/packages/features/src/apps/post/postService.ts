"use client";

import {
  API_BASE,
  IListPayload,
  IPost,
  ISinglePayload,
  PostType,
  SERVER_API,
} from "@repo/core";
import { apiClient } from "@repo/helpers";
import { useCallback } from "react";

interface SeenResponse {
  viewCount: number;
}

export const PostService = () => {
  const markAsSeen = async (
    postId: string,
    postType: PostType,
  ): Promise<ISinglePayload<SeenResponse | null>> => {
    try {
      const res = await apiClient<ISinglePayload<SeenResponse>>(
        SERVER_API.postSeen(postId),
        { method: "PATCH", body: JSON.stringify({ postType }) },
      );
      return res;
    } catch (error) {
      throw error;
    }
  };

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

  return { markAsSeen, fetchFeed };
};

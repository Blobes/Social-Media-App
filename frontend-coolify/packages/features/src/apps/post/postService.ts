"use client";

import {
  API_BASE,
  IListPayload,
  IPost,
  ISinglePayload,
  ITopic,
  PostType,
  SERVER_API,
} from "@repo/core";
import { apiClient } from "@repo/helpers";
import { useCallback } from "react";

export interface TopicLookupReq {
  keyword?: string;
  alreadySelected?: string[];
}

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

  /**
   * Queries remote database index vectors to fetch or search available content categorizations with pagination.
   */
  const lookupTopics = useCallback(
    async (
      data: TopicLookupReq,
      page = 1,
      limit = 20,
    ): Promise<IListPayload<ITopic>> => {
      try {
        const url = `${SERVER_API.lookupTopics}?page=${page}&limit=${limit}`;
        const res = await apiClient<IListPayload<ITopic>>(url, {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
          },
        });

        return {
          status: res.status,
          payload: res.payload ?? [],
          message: res.message,
          metaData: res.metaData,
        };
      } catch (error: any) {
        console.error("Topics Lookup Fetch Error:", error);
        return {
          status: error.status ?? "ERROR",
          payload: [],
          message:
            error.message ??
            "Unable to populate topics directory lookup matrix.",
        };
      }
    },
    [],
  );

  return { markAsSeen, fetchFeed, lookupTopics };
};

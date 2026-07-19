"use client";

import {
  API_BASE,
  DynamicTranslateReq,
  DynamicTranslateRes,
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
  // Notifies the server that a post has been viewed.
  const markAsSeen = async (
    postId: string,
    postType: PostType,
  ): Promise<ISinglePayload<SeenResponse | null>> => {
    return await apiClient<ISinglePayload<SeenResponse>>(
      SERVER_API.postSeen(postId),
      { method: "PATCH", body: JSON.stringify({ postType }) },
    );
  };

  // Fetches a paginated list of feed posts.
  const fetchFeed = useCallback(
    async (
      page: number = 1,
      limit: number = 20,
    ): Promise<IListPayload<IPost>> => {
      const url = `${API_BASE.feed}?page=${page}&limit=${limit}`;
      return await apiClient<IListPayload<IPost>>(url, {
        method: "GET",
      });
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
      const url = `${SERVER_API.lookupTopics}?page=${page}&limit=${limit}`;
      return await apiClient<IListPayload<ITopic>>(url, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    [],
  );

  /**
   * Forwards a dynamic entity caption text block to the server for live engine translation.
   */
  const translateText = useCallback(
    async (
      data: DynamicTranslateReq,
    ): Promise<ISinglePayload<DynamicTranslateRes | null>> => {
      const url = SERVER_API.translateCaption;
      return await apiClient<ISinglePayload<DynamicTranslateRes>>(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
    },
    [],
  );

  return { markAsSeen, fetchFeed, lookupTopics, translateText };
};

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
  SERVER_API,
  MediaUploadPayload,
} from "@repo/core";
import { useCallback } from "react";

export interface CreateGistReq {
  caption?: string;
  media?: MediaUploadPayload[];
  topics?: string[];
  hasSensitiveGraphic?: boolean;
  skipModeration?: boolean;
}

interface LikeResponse {
  likedByMe: boolean;
  likeCount: number;
}

export const GistService = () => {
  // Fetches a paginated list of gists.
  const fetchGistList = useCallback(
    async (page = 1, limit = 20): Promise<IListPayload<IGist>> => {
      const url = `${SERVER_API.gists}?page=${page}&limit=${limit}`;
      return await apiClient<IListPayload<IGist>>(url, {
        method: "GET",
      });
    },
    [],
  );

  // Dispatches a post like interaction event.
  const fetchGistLike = useCallback(
    async (gistId: string): Promise<LikeResponse | null> => {
      const res = await apiClient<ISinglePayload<LikeResponse>>(
        SERVER_API.likeGist(gistId),
        { method: "POST" },
      );
      return res.payload;
    },
    [],
  );

  // Submits pre-uploaded cloud storage structural assets to finalize creating a new post entry.
  const createGist = useCallback(
    async (data: CreateGistReq): Promise<IGist | null> => {
      const res = await apiClient<ISinglePayload<IGist>>(
        SERVER_API.createGist,
        {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      return res.payload;
    },
    [],
  );

  return {
    fetchGistLike,
    getPendingLike: getQueueItem,
    setPendingLike: queueItem,
    clearPendingLike: removeQueueItem,
    fetchGistList,
    createGist,
  };
};

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
  MediaUploadPayload,
  ITopic,
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
  /**
   * Fetches a paginated list of gists.
   */
  const fetchGistList = useCallback(
    async (page = 1, limit = 20): Promise<IListPayload<IGist>> => {
      try {
        const url = `${SERVER_API.gists}?page=${page}&limit=${limit}`;
        const res = await apiClient<IListPayload<IGist>>(url, {
          method: "GET",
        });

        return {
          status: res.status,
          payload: res.payload ?? [],
          message: res.message,
          metaData: res.metaData,
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

  /**
   * Dispatches a post like interaction event.
   */
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

  /**
   * Submits pre-uploaded cloud storage structural assets to finalize creating a new post entry.
   */
  const createGist = useCallback(
    async (data: CreateGistReq): Promise<IGist | null> => {
      try {
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

        if (res.status !== "SUCCESS" || !res.payload) {
          throw new Error(
            res.message || "Failed to commit gist post data record",
          );
        }

        return res.payload;
      } catch (error) {
        console.error("Gist Post Serialization Error:", error);
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
    createGist,
  };
};

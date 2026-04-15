"use client";

import {
  apiClient,
  setPendingState,
  getPendingState,
  clearPendingState,
  enqueueTask,
} from "@repo/helpers";
import {
  IGist,
  ISinglePayload,
  IListPayload,
  API_BASE,
  SERVER_API,
  QUEUE_KEYS,
} from "@repo/core";
import { useCallback } from "react";

export const GistService = () => {
  const fetchGistList = useCallback(async (): Promise<IListPayload<IGist>> => {
    try {
      const res = await apiClient<IListPayload<IGist>>(API_BASE.gists, {
        method: "GET",
      });

      return {
        status: res.status,
        payload: res.payload ?? [],
        message: res.message,
      };
    } catch (error: any) {
      console.error("Gist Service Error:", error);
      return {
        status: error.status,
        payload: null,
        message: error.message ?? "Something went wrong while fetching gists",
      };
    }
  }, []);

  interface LikeResponse {
    likedByMe: boolean;
    likeCount: number;
  }
  // Handle like
  const fetchGistLike = useCallback(
    async (
      gistId: string,
      intendedState: boolean,
    ): Promise<LikeResponse | null> => {
      try {
        const res = await apiClient<ISinglePayload<LikeResponse>>(
          SERVER_API.likeGist(gistId),
          { method: "POST" },
        );
        return res.payload;
      } catch {
        enqueueTask<boolean>(QUEUE_KEYS.POST.LIKE, gistId, intendedState);
        return null;
      }
    },
    [],
  );

  return {
    fetchGistLike,
    getPendingLike: getPendingState,
    setPendingLike: setPendingState,
    clearPendingLike: clearPendingState,
    fetchGistList,
  };
};

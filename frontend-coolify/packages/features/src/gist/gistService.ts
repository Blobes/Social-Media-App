"use client";

import {
  apiClient,
  setPendingLike,
  getPendingLike,
  clearPendingLike,
  enqueueLike,
  serverApi,
  apiBase,
} from "@repo/helpers";
import { IGist, ISinglePayload, IListPayload } from "@repo/types";
import { useCallback } from "react";

export const GistService = () => {
  const fetchGistList = useCallback(async (): Promise<IListPayload<IGist>> => {
    try {
      const res = await apiClient<IListPayload<IGist>>(apiBase.gists, {
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
          serverApi.likeGist(gistId),
          { method: "PUT" },
        );
        return res.payload;
      } catch {
        enqueueLike(gistId, intendedState);
        return null;
      }
    },
    [],
  );

  return {
    fetchGistLike,
    getPendingLike,
    setPendingLike,
    clearPendingLike,
    fetchGistList,
  };
};

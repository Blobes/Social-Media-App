"use client";

import {
  fetcher,
  setPendingLike,
  getPendingLike,
  clearPendingLike,
  enqueueLike,
  serverApi,
} from "@repo/helpers";
import { IGist, ISingleResponse, IListResponse, IUser } from "@repo/types";
import { useCallback } from "react";

export const useGistService = () => {
  const fetchGistList = useCallback(async (): Promise<{
    payload: IGist[] | null;
    message: string;
  }> => {
    try {
      const res = await fetcher<IListResponse<IGist>>(serverApi.gists, {
        method: "GET",
      });

      return {
        payload: res.payload ?? [],
        message: res.message,
      };
    } catch (error: any) {
      console.error("Gist Service Error:", error);
      return {
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
  const handleGistLike = useCallback(
    async (
      gistId: string,
      intendedState: boolean,
    ): Promise<LikeResponse | null> => {
      try {
        const res = await fetcher<ISingleResponse<LikeResponse>>(
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
    handleGistLike,
    getPendingLike,
    setPendingLike,
    clearPendingLike,
    fetchGistList,
  };
};

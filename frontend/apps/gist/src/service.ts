"use client";

import {
  fetcher,
  setPendingLike,
  getPendingLike,
  clearPendingLike,
  enqueueLike,
  serverApi,
} from "@funstakes/helpers";
import { IGist, ISingleResponse, IListResponse, IUser } from "libs/type/type";
import { useCallback } from "react";

export const useGistService = () => {
  const getAllGist = useCallback(async (): Promise<{
    payload: IGist[] | null;
    message: string;
  }> => {
    try {
      const res = await fetcher<IListResponse<IGist & { likedByMe: boolean }>>(
        serverApi.posts,
        { method: "GET" },
      );
      return { payload: res.payload ?? null, message: res.message };
    } catch (error: any) {
      return {
        payload: null,
        message: error.message ?? "Something went wrong",
      };
    }
  }, []);

  // Fetch Author
  const fetchAuthor = useCallback(async (authorId: string) => {
    try {
      const res = await fetcher<ISingleResponse<IUser>>(
        serverApi.user(authorId),
      );
      return res.payload;
    } catch {
      return null;
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
          serverApi.likePost(gistId),
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
    getAllGist,
    fetchAuthor,
  };
};

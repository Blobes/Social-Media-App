"use client";

import { fetcher } from "@/helpers/fetcher";
import { Post, SingleResponse, ListResponse } from "@/types";
import { useCallback } from "react";
import {
  setPendingLike,
  getPendingLike,
  clearPendingLike,
  enqueueLike,
  processQueue,
} from "@/helpers/post";

export const usePost = () => {
  const getAllPost = async (): Promise<{
    payload: Post[] | null;
    message: string;
  }> => {
    try {
      const res = await fetcher<ListResponse<Post>>(`/posts`, {
        method: "GET",
      });
      return { payload: res.payload ?? null, message: res.message };
    } catch (error: any) {
      return {
        payload: null,
        message: error.message ?? "Something went wrong",
      };
    }
  };

  const handlePostLike = useCallback(
    async (postId: string): Promise<Post | null> => {
      try {
        const res = await fetcher<SingleResponse<Post>>(
          `/posts/${postId}/like`,
          {
            method: "PUT",
          }
        );
        return res.payload;
      } catch {
        enqueueLike(postId);
        return null;
      }
    },
    []
  );
  // run sync like when online + app boot
  if (typeof window !== "undefined") {
    window.addEventListener("online", processQueue);
    processQueue();
  }

  return {
    handlePostLike,
    getPendingLike,
    setPendingLike,
    clearPendingLike,
    getAllPost,
  };
};

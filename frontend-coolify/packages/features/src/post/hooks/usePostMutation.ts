"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUEUE_KEYS } from "@repo/core";
import { updateCacheItem } from "@repo/helpers";

/**
 * Manages the API mutation and TanStack Query cache.
 */
export const usePostLikeMutation = (
  onLikeApi: (id: string) => Promise<any>,
  setSBMessage: (config: any) => void,
  queryKey?: string[],
  clearPendingLike?: (key: string, id: string) => void,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: onLikeApi,
    onSuccess: (payload, id) => {
      if (payload && queryKey) {
        // Sync the cache without refetching.
        updateCacheItem(queryClient, queryKey, id, (item) => ({
          ...item,
          likedByMe: payload.likedByMe,
          likeCount: payload.likeCount,
        }));
      }
      if (clearPendingLike) {
        clearPendingLike(QUEUE_KEYS.POST.PENDING_LIKES, id);
      }
    },
    onError: (error) => {
      setSBMessage({
        msg: {
          content: error.message || "Post like sync failed:",
          error,
          msgStatus: "ERROR",
          hasClose: true,
        },
        override: true,
      });
      console.error("Post like sync failed:", error);
    },
  });
};

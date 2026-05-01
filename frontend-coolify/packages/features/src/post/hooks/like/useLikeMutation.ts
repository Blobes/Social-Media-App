"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IPost, QUEUE_KEYS } from "@repo/core";
import { updateCacheItem } from "@repo/helpers";
import { SBMessage } from "@repo/shared-hooks";

/**
 * Syncs server-confirmed like state back into cache and optional external stores.
 */
export const usePostLikeMutation = (
  onLikeApi: (id: string) => Promise<any>,
  setSBMessage: (config: SBMessage) => void,
  queryKey?: string[] | string[][],
  clearPendingLike?: (key: string, id: string) => void,
  updateStore?: (id: string, likedByMe: boolean, likeCount: number) => void,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: onLikeApi,
    onSuccess: (payload, id) => {
      if (payload && queryKey) {
        // If queryKey is an array of arrays, loop through them
        const keysToUpdate = Array.isArray(queryKey[0]) ? queryKey : [queryKey];
        keysToUpdate.forEach((key) => {
          updateCacheItem<IPost>(
            queryClient,
            key as string[],
            id,
            (oldItem) => ({
              ...oldItem,
              likedByMe: payload.likedByMe,
              likeCount: payload.likeCount,
            }),
          );
        });
      }

      // Keep the external store aligned with the final server-confirmed value.
      if (payload && updateStore) {
        updateStore(id, payload.likedByMe, payload.likeCount);
      }

      if (clearPendingLike) {
        clearPendingLike(QUEUE_KEYS.POST.PENDING_LIKES, id);
      }
    },
    onError: (error) => {
      setSBMessage({
        msg: {
          tagline: error.message || "Post like sync failed:",
          msgStatus: "ERROR",
          hasClose: true,
        },
        override: true,
      });
      console.error("Post like sync failed:", error);
    },
  });
};

"use client";

import { useMutation, useQueryClient, QueryKey } from "@tanstack/react-query";
import { ApiError, IPost, POST_FEEDBACK, STORAGE_KEYS } from "@repo/core";
import { updateCacheItem } from "@repo/helpers";
import { SBMessage, useStaticTranslation } from "@repo/shared-hooks";

/**
 * Syncs server-confirmed like state back into cache and optional external stores.
 */
export const usePostLikeMutation = (
  onLikeApi: (id: string) => Promise<any>,
  setSBMessage: (config: SBMessage) => void,
  queryKey?: QueryKey | QueryKey[],
  clearPendingLike?: (key: string, id: string) => void,
  updateStore?: (id: string, likedByMe: boolean, likeCount: number) => void,
) => {
  const queryClient = useQueryClient();
  const { translateTxtString } = useStaticTranslation();

  return useMutation({
    // Wrap the call explicitly to ensure the single incoming variable maps directly as the id parameter
    mutationFn: (id: string) => onLikeApi(id),
    onSuccess: (payload, id) => {
      if (payload && queryKey) {
        // If queryKey is an array of arrays, loop through them
        const keysToUpdate = Array.isArray(queryKey[0])
          ? (queryKey as QueryKey[])
          : [queryKey as QueryKey];
        keysToUpdate.forEach((key) => {
          updateCacheItem<IPost>(queryClient, key, id, (oldItem) => ({
            ...oldItem,
            likedByMe: payload.likedByMe,
            likeCount: payload.likeCount,
          }));
        });
      }

      // Keep the external store aligned with the final server-confirmed value.
      if (payload && updateStore) {
        updateStore(id, payload.likedByMe, payload.likeCount);
      }

      if (clearPendingLike) {
        clearPendingLike(STORAGE_KEYS.POST.PENDING_LIKES, id);
      }
    },
    onError: (error: ApiError) => {
      setSBMessage({
        msg: {
          msgStatus: "ERROR",
          tagline:
            error.localizedErrMsg ||
            translateTxtString(POST_FEEDBACK.like_sync_failed_tagline),
          hasClose: true,
        },
        override: true,
      });
      console.error("Post like sync failed:", error);
    },
  });
};

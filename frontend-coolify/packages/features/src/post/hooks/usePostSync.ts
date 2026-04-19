"use client";

import { useEffect } from "react";
import { processQueue } from "@repo/helpers";
import { QUEUE_KEYS } from "@repo/core";
import { LikablePost, UsePostLikeContext } from "./usePostLike";

/**
 * Handles background queue processing and initial mounting sync.
 */
export const usePostLikeSync = <T extends LikablePost>(
  _id: string,
  post: T,
  context: UsePostLikeContext,
  onLikeApi: (id: string) => Promise<any>,
  setPostData: React.Dispatch<React.SetStateAction<T>>,
) => {
  const { getPendingLike, clearPendingLike, updateStore, authStatus } = context;

  /**
   * Syncs local storage pending likes with state on mount.
   */
  useEffect(() => {
    const pending = getPendingLike(QUEUE_KEYS.POST.PENDING_LIKES, _id);
    const pendingLike = pending?.newValue;

    if (pendingLike !== undefined && pendingLike !== post.likedByMe) {
      const nextCount = post.likeCount + (pendingLike ? 1 : -1);

      setPostData((prev) => ({
        ...prev,
        likedByMe: pendingLike,
        likeCount: nextCount,
      }));

      if (updateStore) updateStore(_id, pendingLike, nextCount);
      clearPendingLike(QUEUE_KEYS.POST.PENDING_LIKES, _id);
    }
  }, [_id, post.likedByMe]);

  /**
   * Processes the background queue when online.
   */
  useEffect(() => {
    if (authStatus === "AUTHENTICATED") {
      processQueue(authStatus, QUEUE_KEYS.POST.PENDING_LIKES, onLikeApi);

      const handleOnline = () =>
        processQueue(authStatus, QUEUE_KEYS.POST.PENDING_LIKES, onLikeApi);

      window.addEventListener("online", handleOnline);
      return () => window.removeEventListener("online", handleOnline);
    }
  }, [authStatus, onLikeApi]);
};
